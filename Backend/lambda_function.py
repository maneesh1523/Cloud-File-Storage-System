import json
import boto3
import uuid
import time
from decimal import Decimal
from boto3.dynamodb.conditions import Key

# AWS Clients
s3 = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")

# Config
BUCKET = "maneesh-cloud-storage-2026"
TABLE = "FileMetadata"

table = dynamodb.Table(TABLE)

def convert_decimal(obj):
    if isinstance(obj, list):
        return [convert_decimal(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: convert_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        return int(obj)
    else:
        return obj


def lambda_handler(event, context):

    # Get request info
    path = event.get("path", "")
    method = event.get("httpMethod", "")

    print("PATH:", path)
    print("METHOD:", method)

    # Temporary user (later replace with Cognito)
    try:
        claims = event["requestContext"]["authorizer"]["claims"]
    except KeyError:
        return cors({"error": "Unauthorized"})

    user_id = claims.get("sub")
    groups = claims.get("cognito:groups", [])

    if isinstance(groups, str):
        groups = [groups]

    valid_roles = ["Admin", "User", "Viewer"]

    if not any(role in groups for role in valid_roles):
        return cors({
            "error": "Access denied. Please contact administrator."
        })


    # ---------------- GET UPLOAD URL ----------------
    if path == "/upload-url" and method == "GET":

        if "Admin" not in groups and "User" not in groups:
            return cors({"error": "Upload access denied"})

        params = event.get("queryStringParameters") or {}
        tags = params.get("tags","")
        file_name = params.get("name")

        if not file_name:
            return cors({"error": "Filename missing"})

        print("USER_ID:", user_id)

        key = str(uuid.uuid4()) + "_" + file_name

        url = s3.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": BUCKET,
                "Key": key
            },
            ExpiresIn=300
        )

        # Save metadata in DynamoDB
        table.put_item(
            Item={
                "userId": user_id,
                "fileName": file_name,
                "s3Key": key,
                "uploadTime": int(time.time()),
                "tags": tags
            }
        )

        return cors({
            "uploadUrl": url,
            "key": key
        })


    # ---------------- LIST FILES ----------------
    if path == "/list" and method == "GET":

        try:
            print("USER_ID:", user_id)
            params = event.get("queryStringParameters") or {}
            filter_tag = (params.get("tag") or "").lower()

            response = table.query(
                KeyConditionExpression=Key("userId").eq(user_id)
            )

            files = []

            for item in response.get("Items", []):

                item_tags = (item.get("tags") or "").lower()

                # Tag filter
                if filter_tag and filter_tag not in item_tags:
                    continue

                files.append({
                    "name": item.get("fileName"),
                    "key": item.get("s3Key"),
                    "tags": item.get("tags", ""),
                    "downloadCount": item.get("downloadCount", 0),
                    "lastDownload": item.get("lastDownloadTime", "")
                })

            return cors({"files": convert_decimal(files)})

        except Exception as e:
            print("LIST ERROR:", str(e))
            return cors({"files": []})


    # ---------------- DOWNLOAD ----------------
    if path == "/download" and method == "GET":

        params = event.get("queryStringParameters") or {}
        key = params.get("key")
        file_name = params.get("name")

        if not key or not file_name:
            return cors({"error": "Missing Key or filename missing"})

        # Update download count and last download time
        table.update_item(
            Key={
            "userId": user_id,
            "fileName": file_name
            },
            UpdateExpression="""
            SET downloadCount = 
            if_not_exists(downloadCount, :zero) + :inc,
                lastDownloadTime = :time
            """,
            ExpressionAttributeValues={
                ":inc": 1,
                ":zero": 0,
                ":time": int(time.time())
            }
        )

        if not key:
            return cors({"error": "Key missing"})

        url = s3.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": BUCKET,
                "Key": key,
                "ResponseContentDisposition": "attachment"
            },
            ExpiresIn=600
        )

        return cors({
            "url": url
        })


    # ---------------- DELETE FILE ----------------
    if path == "/delete" and method == "DELETE":

        if "Admin" not in groups:
            return cors({"error": "Access denied"})

        params = event.get("queryStringParameters") or {}
        key = params.get("key")
        filename = params.get("name")   # get filename also

        if not key or not filename:
            return cors({"error": "Key or filename missing"})

        try:
            # 1️⃣ Delete from S3
            s3.delete_object(
                Bucket=BUCKET,
                Key=key
            )

            # 2️⃣ Delete from DynamoDB (USE CORRECT KEY)
            table.delete_item(
                Key={
                    "userId": user_id,
                    "fileName": filename
                }
            )

            return cors({
                "message": "File deleted successfully"
            })

        except Exception as e:
            print("DELETE ERROR:", e)

            return cors({
                "error": "Delete failed"
            })


    # ---------------- DEFAULT ----------------
    return cors({"error": "Invalid request"})





# ---------------- CORS ----------------
def cors(body):

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*"
        },
        "body": json.dumps(body)
    }