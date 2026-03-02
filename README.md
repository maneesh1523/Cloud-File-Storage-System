# Cloud-Based File Storage System with Role-Based Access

## 📌 Overview
This project is a secure and scalable cloud-based file storage system built using AWS serverless architecture.

Users can upload, download, and manage files based on their assigned roles (Admin/User).

---

## 🚀 AWS Services Used

- Amazon S3 (File Storage with Versioning & Lifecycle Rules)
- Amazon DynamoDB (Metadata Storage)
- Amazon Cognito (Authentication & Authorization)
- AWS Lambda (Backend Logic)
- API Gateway (REST APIs)
- IAM (Access Control)

---

## 🔐 Security Architecture

- JWT-based Authentication (Cognito)
- API Gateway Authorizer
- IAM Least Privilege Roles
- Pre-signed URLs for secure upload/download
- S3 Versioning Enabled
- Lifecycle Rules Configured
- HTTPS Encryption

📄 See full Security Architecture:  
`docs/Security-Architecture.pdf`

---

## 📂 Features

- User Signup with OTP Verification
- Role-Based Access Control
- Secure File Upload
- Secure File Download
- Download Count Tracking
- File Tagging
- Admin-only Delete Permission

---

## 🏗 Architecture Diagram

![Architecture](docs/architecture.png)

---

## 🎥 Demo Video

Demo Video Link:  
(See demo/demo-video-link.txt)

---

## 📘 Deployment Guide

Step-by-step deployment instructions available in:

`docs/Deployment-Guide.pdf`

---

## 📑 Full Documentation

See:

`docs/Documentation.pdf`

---

## 👨‍💻 Team

Project developed as part of Cloud Computing course using AWS serverless services.