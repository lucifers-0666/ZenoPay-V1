const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "wd0ashok@gmail.com",
        pass: "dabw ngtd ayby ofbb",
      },
    });
  }

  // send basic email
  async sendEmail(to, subject, html) {
    try {
      await this.transporter.sendMail({
        from: `"Govt Banking & UIDAI Portal" <wd0ashok@gmail.com>`,
        to,
        subject,
        html,
      });
    } catch (err) {
      console.error("Email Error:", err.message);
    }
  }

  // Aadhaar email
  async sendAadhaarRegistrationEmail(
    email,
    fullName,
    aadharNumber,
    dob,
    gender,
    address,
    password
  ) {
    const formattedAadhar = this.formatAadhar(aadharNumber);

    // Gender Illustration
    let finalImage =
      gender.toLowerCase() === "male"
        ? "https://cdn-icons-png.flaticon.com/512/2922/2922510.png"
        : gender.toLowerCase() === "female"
        ? "https://cdn-icons-png.flaticon.com/512/2922/2922561.png"
        : "https://cdn-icons-png.flaticon.com/512/2922/2922688.png";

    // High-quality PNG of Ashoka Chakra (fixed size, gmail support)
    const chakraURL = "hhttps://ibb.co/PG5J9m6v";

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Aadhaar Email</title>
</head>

<body style="margin:0;padding:0;background:#f3f3f3;font-family:Arial, sans-serif;">

<!-- MAIN WRAPPER -->
<table width="100%" cellpadding="0" cellspacing="0" style="padding:25px 0;background:#f3f3f3;">
<tr><td align="center">

<!-- MAIN EMAIL CONTAINER -->
<table width="650" cellpadding="0" cellspacing="0" 
       style="background:#ffffff;border-radius:10px;overflow:hidden;">

<!-- HEADER -->
<tr>
<td style="background:#f4b400;padding:15px;color:white;font-weight:bold;font-size:22px;">
    Mera Aadhaar, Meri Pehchaan
    <div style="font-size:12px;color:#fff8d9;">Government of India</div>
</td>
</tr>

<!-- BODY -->
<tr><td style="padding:25px;">

    <div style="font-size:24px;font-weight:bold;margin-bottom:5px;">Enrollment Successful</div>

    <p style="color:#555;margin:0 0 15px;line-height:1.5;">
        Dear Applicant, your Aadhaar number has been generated successfully.<br>
        For more details visit: <b>localhost:3000/ViewProfile</b>
    </p>

    <div style="font-size:16px;font-weight:bold;margin-bottom:20px;">
        Password: ${password}
    </div>

    <!-- OUTER BORDER -->
    <div style="border:3px solid #e86e0a;border-radius:12px;padding:10px;">

        <!-- INNER BORDER -->
        <table width="100%" cellpadding="0" cellspacing="0" 
               style="border:3px solid #067504;border-radius:12px;background:white;">

            <!-- TOP HEADER SECTION -->
            <tr style="border-bottom:1px solid #ddd;">
                <td style="padding:10px;">
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/300px-Emblem_of_India.svg.png"
                      height="42">
                </td>
                <td align="right" style="padding:10px;">
                    <div style="font-size:14px;font-weight:bold;color:#333;">Govt. of India</div>
                    <div style="font-size:11px;color:#777;">Unique Identification Authority</div>
                </td>
            </tr>

            <!-- BODY WITH ASHOKA CHAKRA -->

            <tr>
                <td colspan="2" style="padding:0;">

                    <!--[if gte mso 9]>
                    <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false"
                        style="width:100%; height:260px;">
                        <v:fill type="frame" src="${chakraURL}" color="#ffffff"/>
                    </v:rect>
                    <![endif]-->

                    <div style="
                        width:100%;
                        height:260px;
                        background-image:url('${chakraURL}');
                        background-repeat:no-repeat;
                        background-position:center 20px;
                        background-size:180px;
                        padding:20px;
                    ">

                        <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>

                                <!-- PHOTO -->
                                <td width="135" valign="top" style="padding-top:40px;">
                                    <div style="width:110px;height:140px;border:1px solid #ccc;background:#eee;">
                                        <img src="${finalImage}" 
                                             style="width:110px;height:140px;object-fit:cover;">
                                    </div>
                                </td>

                                <!-- DETAILS -->
                                <td valign="top" 
                                    style="padding-left:15px;font-size:14px;color:#444;padding-top:40px;">

                                    <div style="font-size:18px;font-weight:bold;text-transform:uppercase;">
                                        ${fullName}
                                    </div>

                                    <div style="margin-top:6px;">DOB: <strong>${dob}</strong></div>
                                    <div>Gender: <strong>${gender}</strong></div>

                                    <div style="margin-top:12px;font-size:12px;color:#555;line-height:1.5;">
                                        <span style="color:red;font-size:14px;">&#9873;</span>
                                        ${address}
                                    </div>

                                </td>
                            </tr>
                        </table>

                    </div>

                </td>
            </tr>

            <!-- AADHAAR NUMBER FOOTER -->
            <tr>
                <td colspan="2" align="center"
                    style="padding:15px;background:#fafafa;border-top:1px solid #ddd;">
                    <div style="font-size:26px;letter-spacing:3px;font-weight:bold;">
                        ${formattedAadhar}
                    </div>
                    <div style="font-size:11px;color:#888;margin-top:5px;">
                        Aadhaar - Ordinary Right of Common Man
                    </div>
                </td>
            </tr>

        </table>

    </div>

</td></tr>

</table>

</td></tr>
</table>

</body>
</html>
`;

    await this.sendEmail(
      email,
      "UIDAI - Aadhaar Registration Successful",
      html
    );
  }

  // Format Aadhaar
  formatAadhar(num) {
    const digits = num.replace(/\D/g, "");
    return digits.replace(/(\d{4})(\d{4})(\d{4})/, "$1 $2 $3");
  }
}

module.exports = new EmailService();
