exports.handler = async function (event) {

    // Only allow POST
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                success: false,
                error: "Method not allowed"
            })
        };
    }

    try {

        // Read request body
        const data = JSON.parse(event.body || "{}");

        const date = data.date || "-";
        const time = data.time || "-";
        const foods = Array.isArray(data.foods)
            ? data.foods
            : [];

        // Environment variables
        const API_KEY = process.env.BREVO_API_KEY;
        const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL;
        const SENDER_EMAIL = process.env.SENDER_EMAIL;

        // Check configuration
        if (!API_KEY || !NOTIFY_EMAIL || !SENDER_EMAIL) {
            console.error("Missing environment variables");

            return {
                statusCode: 500,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    success: false,
                    error: "Server email configuration is incomplete"
                })
            };
        }

        const foodText = foods.length
            ? foods.join(", ")
            : "Not selected";

        // Email HTML
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
</head>

<body style="
    margin:0;
    padding:30px;
    background:#f8eef2;
    font-family:Arial,sans-serif;
">

<div style="
    max-width:600px;
    margin:auto;
    background:white;
    border-radius:20px;
    padding:30px;
    box-shadow:0 10px 30px rgba(0,0,0,.08);
">

<h1 style="
    color:#7e3f58;
    margin-top:0;
">
❤️ New Date Confirmation
</h1>

<p>
Someone just completed your date invitation.
</p>

<hr style="border:none;border-top:1px solid #ead7df;">

<p>
<strong>📅 Date:</strong><br>
${escapeHtml(date)}
</p>

<p>
<strong>⏰ Time:</strong><br>
${escapeHtml(time)}
</p>

<p>
<strong>🍽️ Food:</strong><br>
${escapeHtml(foodText)}
</p>

<hr style="border:none;border-top:1px solid #ead7df;">

<p style="color:#765b66;">
Your invitation has been successfully confirmed. ❤️
</p>

</div>

</body>
</html>
`;

        // Send through Brevo
        const response = await fetch(
            "https://api.brevo.com/v3/smtp/email",
            {
                method: "POST",

                headers: {
                    "accept": "application/json",
                    "api-key": API_KEY,
                    "content-type": "application/json"
                },

                body: JSON.stringify({
                    sender: {
                        email: SENDER_EMAIL,
                        name: "Date Invitation"
                    },

                    to: [
                        {
                            email: NOTIFY_EMAIL,
                            name: "You"
                        }
                    ],

                    subject: "❤️ Someone accepted your date invitation!",

                    htmlContent: htmlContent,

                    textContent:
                        "New Date Confirmation\n\n" +
                        "Date: " + date + "\n" +
                        "Time: " + time + "\n" +
                        "Food: " + foodText
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {

            console.error("Brevo error:", result);

            return {
                statusCode: 502,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    success: false,
                    error: "Brevo failed to send email"
                })
            };
        }

        console.log("Email sent:", result.messageId);

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                success: true,
                messageId: result.messageId
            })
        };

    } catch (error) {

        console.error("Function error:", error);

        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                success: false,
                error: "Something went wrong"
            })
        };
    }
};


// Prevent HTML injection in email
function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
