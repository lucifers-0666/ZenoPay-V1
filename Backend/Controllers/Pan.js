const PanDetails = require("../Models/PanDetails");
// const emailService = require("../Services/EmailService"); 

const getRegisterPan = (req, res) => {
  res.render("RegisterPan", {
    pageTitle: "Register PAN",
  });
};

const postRegisterPan = async (req, res) => {
  try {
    const data = req.body;
    const file = req.file; 

    // 1. Check if PAN Number already exists (Manual check if unique index isn't enough for custom error)
    const existingPan = await PanDetails.findOne({ PanNumber: data.panNumber });
    if (existingPan) {
      return res.status(400).json({ 
        success: false, 
        message: "This PAN Number is already registered." 
      });
    }

    // 2. Check if Aadhaar is already linked to another PAN (Optional logic, but good for integrity)
    const existingAadharLink = await PanDetails.findOne({ AadharNumber: data.aadharNumber });
    if (existingAadharLink) {
        return res.status(400).json({
            success: false,
            message: "This Aadhaar is already linked to a PAN Card."
        });
    }

    // 3. Create new PAN Entry
    const newPan = new PanDetails({
      PanNumber: data.panNumber,
      AadharNumber: data.aadharNumber,
      FullName: data.fullName,
      DOB: data.dob,
      Gender: data.gender,
      Mobile: data.mobile,
      Email: data.email,
      FatherName: data.fatherName,
      Address: data.address,
      City: data.city,
      State: data.state,
      Pincode: data.pincode,
      ImagePath: file ? `/PanImages/${file.filename}` : null,
    });

    await newPan.save();

    // 4. Send Response
    res.status(200).json({
      success: true,
      message: "PAN Card Registration Submitted Successfully!",
    });

  } catch (err) {
    console.error("PAN Registration Error:", err);
    
    // Handle duplicate key error (E11000) from MongoDB just in case
    if (err.code === 11000) {
        return res.status(400).json({ 
            success: false, 
            message: "Duplicate entry detected (PAN or Aadhaar)." 
        });
    }

    res.status(500).json({ 
        success: false, 
        message: "Internal Server Error. Please try again later." 
    });
  }
};

const VerifyPanNumber = async (req, res) => {
  const { panNumber } = req.body;
  console.log("Verifying PAN Number:", panNumber);
  try {
    const existingPan = await PanDetails.findOne({
      PanNumber: panNumber,
    });
    if (existingPan) {
      return res.json({
        success: true,
        message: "PAN Number is already registered.",
      });
    }
    res.json({
      success: false,
      message: "PAN Number is available for registration.",
    });
  }
  catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
module.exports = {
  getRegisterPan,
  postRegisterPan,
  VerifyPanNumber,
};