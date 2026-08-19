exports.handler = async (event) => {

    /* =========================
       ONLY POST ALLOWED
    ========================= */

    if (event.httpMethod !== "POST") {
        return jsonResponse(405, {
            success: false,
            error: "Method not allowed"
        });
    }


    try {

        /* =========================
           PARSE REQUEST
        ========================= */

        let data;

        try {
            data = JSON.parse(event.body || "{}");
        } catch (error) {
            return jsonResponse(400, {
                success: false,
                error: "Invalid JSON request"
            });
        }


        /* =========================
           DATA
        ========================= */

        const date =
            String(data.date || "-");

        const time =
            String(data.time || "-");

        const foods =
            Array.isArray(data.foods)
                ? data.foods.map(String)
                : [];


        /* =========================
           ENVIRONMENT VARIABLES
        ========================= */

        const API_KEY =
            process.env.BREVO_API_KEY;

        const NOTIFY_EMAIL =
            process.env.NOTIFY_EMAIL;

        const SENDER_EMAIL =
            process.env.SENDER_EMAIL;


        if (
            !API_KEY ||
            !NOTIFY_EMAIL ||
            !SENDER_EMAIL
        ) {

            console.error(
                "Missing required environment variables"
            );

            return jsonResponse(500, {
                success: false,
                error: "Email configuration is incomplete"
            });
        }


        /* =========================
           FOOD TEXT
        ========================= */

        const foodText =
            foods.length > 0
                ? foods.join(", ")
                : "Not selected";


        /* =========================
           EMAIL HTML
        ========================= */

        const htmlContent = `
<!DOCTYPE html>

<html lang="en">

<head>
<meta charset="UTF-8">

<title>Date Confirmation</title>

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
background:#ffffff;
border-radius:20px;
padding:30px;
">

<h1 style="
color:#7e3f58;
margin-top:0;
">
❤️ New Date Confirmation
</h1>

<p>
Someone just accepted your date invitation.
</p>

<hr>

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

<hr>

<p style="
color:#765b66;
">
Your date invitation was successfully confirmed. ❤️
</p>

</div>

</body>

</html>
`;


        /* =========================
           BREVO API
        ========================= */

        const brevoResponse = await fetch(
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

                    subject:
                        "❤️ Someone accepted your date invitation!",

                    htmlContent: htmlContent,

                    textContent:
                        "New Date Confirmation\n\n" +
                        "Date: " + date + "\n" +
                        "Time: " + time + "\n" +
                        "Food: " + foodText
                })
            }
        );


        /* =========================
           BREVO RESPONSE
        ========================= */

        const responseText =
            await brevoResponse.text();

        let result = {};

        try {
            result = JSON.parse(responseText);
        } catch (error) {
            result = {
                raw: responseText
            };
        }


        /* =========================
           BREVO ERROR
        ========================= */

        if (!brevoResponse.ok) {

            console.error(
                "Brevo error:",
                brevoResponse.status,
                result
            );

            return jsonResponse(502, {
                success: false,
                error:
                    result.message ||
                    "Brevo failed to send email"
            });
        }


        /* =========================
           SUCCESS
        ========================= */

        console.log(
            "Email sent successfully:",
            result.messageId
        );

        return jsonResponse(200, {
            success: true,
            messageId:
                result.messageId || null
        });


    } catch (error) {

        console.error(
            "Function error:",
            error
        );

        return jsonResponse(500, {
            success: false,
            error: "Something went wrong"
        });
    }
};


/* =========================
   JSON RESPONSE
========================= */

function jsonResponse(statusCode, body) {

    return {
        statusCode: statusCode,

        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
        },

        body: JSON.stringify(body)
    };
}


/* =========================
   HTML ESCAPE
========================= */

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
