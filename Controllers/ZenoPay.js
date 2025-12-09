const ZenoPayDetails = require("../Models/ZenoPayUser");
const emailService = require("../Services/EmailService"); 

const getRegisterZenoPay = (req, res) => {
  res.render("ZenoPayRegister",{
    isLoggedIn: req.session.isLoggedIn || false,
    user: req.session.user || null,
    currentPage: "ZenoPay Registration",
    qrCode : req.session.qrCode || null,
  });
};

const postRegisterZenoPay = async (req, res) => {
  try {
    const data = req.body;
    const file = req.file;

    const existingEmail = await ZenoPayDetails.findOne({ Email: data.Email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already registered. Please use a different email.",
      });
    }

    const ZenoPayID = "ZENO-" + Date.now();

    const newZenoPay = new ZenoPayDetails({
      ZenoPayID,
      Password: data.Password,
      FullName: data.FullName,
      DOB: data.DOB,
      Gender: data.Gender,
      Mobile: data.Mobile,
      Email: data.Email,
      FatherName: data.FatherName,
      MotherName: data.MotherName || "",
      Address: data.Address,
      City: data.City,
      State: data.State,
      Pincode: data.Pincode,
      Role: data.Role || "user",
      BusinessName: data.BusinessName || "",
      ImagePath: file ? `/Uploads/${file.filename}` : null,
    });

    await newZenoPay.save();

    // Send Email (optional)
    try {
      await emailService.sendZenoPayRegistrationEmail(
        data.Email,
        data.FullName,
        ZenoPayID
      );
    } catch (emailError) {
      console.log("Email sending failed:", emailError);
    }

    res.json({
      success: true,
      message: "ZenoPay Registration Successful!",
      ZenoPayID,
    });
  } catch (err) {
    console.log("Registration error:", err);

    // Handle duplicate key errors
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already registered. Please use a different email.",
      });
    }

    // Handle validation errors
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

const VerifyZenoPayId = async (req, res) => {
  const { zenoPayId } = req.body;
  console.log("Verifying ZenoPay ID:", zenoPayId);

  try {
    const user = await ZenoPayDetails.findOne({ ZenoPayID: zenoPayId });

    if (user) {
      return res.status(200).json({
        success: true,
        message: "ZenoPay ID verified successfully!",
        details: {
          FullName: user.FullName,
          DOB: user.DOB,
          Gender: user.Gender,
          Mobile: user.Mobile,
          Email: user.Email,
          City: user.City,
          State: user.State,
          Pincode: user.Pincode,
        },
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "ZenoPay ID not found in database.",
      });
    }
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ success: false, message: "Server error during verification." });
  }
};

module.exports = {
  getRegisterZenoPay,
  postRegisterZenoPay,
  VerifyZenoPayId,
};
