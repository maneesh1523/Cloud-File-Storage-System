const poolData = {
  UserPoolId: "ap-south-1_YeHCTfzRf",
  ClientId: "3hkee128ab2v0nlvcvkgi11q5f"
};

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

let currentUser = null;


// -------- SIGNUP --------
function signup() {

  const emailEl = document.getElementById("email");
  const passEl = document.getElementById("password");

  if (!emailEl || !passEl) {
    alert("Email or Password field not found");
    return;
  }

  const email = emailEl.value.trim();
  const password = passEl.value.trim();

  if (!email || !password) {
    alert("Enter email & password");
    return;
  }

  const attributeList = [];

  const attributeEmail =
    new AmazonCognitoIdentity.CognitoUserAttribute({
      Name: "email",
      Value: email
    });

  attributeList.push(attributeEmail);

  userPool.signUp(
    email,
    password,
    attributeList,
    null,

    function (err, result) {

      if (err) {
        alert(err.message);
        return;
      }

      currentUser = result.user;

      alert("OTP sent to email");
    }
  );
}



// -------- CONFIRM OTP --------
function confirmOtp() {

  const otpEl = document.getElementById("otp");

  if (!otpEl) {
    alert("OTP field missing");
    return;
  }

  const otp = otpEl.value.trim();

  if (!otp) {
    alert("Enter OTP");
    return;
  }

  if (!currentUser) {
    alert("Signup first");
    return;
  }

  currentUser.confirmRegistration(
    otp,
    true,

    function (err) {

      if (err) {
        alert(err.message);
        return;
      }

      alert("Account confirmed. Now login.");
    }
  );
}



// -------- LOGIN --------
function login() {

  const emailEl = document.getElementById("email");
  const passEl = document.getElementById("password");

  if (!emailEl || !passEl) {
    alert("Input fields missing");
    return;
  }

  const email = emailEl.value.trim();
  const password = passEl.value.trim();

  if (!email || !password) {
    alert("Enter email & password");
    return;
  }

  const authDetails =
    new AmazonCognitoIdentity.AuthenticationDetails({
      Username: email,
      Password: password
    });

  const userData = {
    Username: email,
    Pool: userPool
  };

  const user =
    new AmazonCognitoIdentity.CognitoUser(userData);

  user.authenticateUser(authDetails, {

    onSuccess: function (result) {

        const idToken = result.getIdToken().getJwtToken();

        localStorage.setItem("token", idToken);

        alert("Login successful");

        window.location.href = "dashboard.html";
    },

    onFailure: function (err) {

      alert(err.message);
    }
  });
}



// -------- ENTER KEY --------
document.addEventListener("keydown", function (e) {

  if (e.key === "Enter") {

    const otpField = document.getElementById("otp");

    if (document.activeElement === otpField) {

      confirmOtp();

    } else {

      login();
    }
  }
});