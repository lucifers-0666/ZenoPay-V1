const AadharDetails = require("../Models/AadharDetails");
const emailService = require("../Services/EmailService"); // Your Node.js email service

const getRegisterAadhar = (req, res) => {
  res.render("RegisterAadhar");
};

const postRegisterAadhar = async (req, res) => {
  try {
    const data = req.body;
    const file = req.file; // saved only in DB

    // Generate AadharID
    const AadharID = "AADHAR-" + Date.now();

    // Generate password
    const last4 = data.mobileNumber.slice(-4);
    const year = new Date(data.dob).getFullYear();
    const password = `${last4}${year}`;

    // Save to DB
    const newAadhar = new AadharDetails({
      AadharID,
      Password: password,
      FullName: data.fullName,
      AadharNumber: data.aadharNumber.replace(/\s/g, ""),
      DOB: data.dob,
      Gender: data.gender,
      Mobile: data.mobileNumber,
      Email: data.email,
      FatherName: data.fatherName,
      MotherName: data.motherName,
      Address: data.address,
      City: data.city,
      State: data.state,
      Pincode: data.pincode,
      ImagePath: file ? `/AadharImages/${file.filename}` : null, // stored but NOT sent in email
    });

    await newAadhar.save();

    // Send Email (ILLUSTRATION ONLY)
    await emailService.sendAadhaarRegistrationEmail(
      data.email,
      data.fullName,
      data.aadharNumber.replace(/\s/g, ""),
      data.dob,
      data.gender,
      data.address,
      password // send password
    );

    res.json({
      success: true,
      message: "Aadhaar Registered Successfully",
      AadharID,
      password,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const VerifyAadharNumber = async (req, res) => {
  const { aadharNumber } = req.body;
  console.log("Verifying Aadhar Number:", aadharNumber);
  
  try {
    const existingAadhar = await AadharDetails.findOne({
      AadharNumber: aadharNumber,
    });

    if (existingAadhar) {
      // Return success AND the details to auto-fill the form
      return res.status(200).json({ 
          success: true, 
          message: "Aadhaar Verified! Details fetched.",
          details: {
              FullName: existingAadhar.FullName,
              DOB: existingAadhar.DOB, // Ensure format is YYYY-MM-DD if needed by frontend, or handle in frontend
              Gender: existingAadhar.Gender,
              Mobile: existingAadhar.Mobile,
              Email: existingAadhar.Email,
              FatherName: existingAadhar.FatherName,
              Address: existingAadhar.Address,
              City: existingAadhar.City,
              State: existingAadhar.State,
              Pincode: existingAadhar.Pincode
          }
      });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Aadhaar Number not found in database." });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Server error during verification." });
  }
};

module.exports = {
  getRegisterAadhar,
  postRegisterAadhar,
  VerifyAadharNumber,
};
