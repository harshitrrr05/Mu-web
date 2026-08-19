exports.handler = async function (event) {

    // Only allow POST requests
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({
                success: false,
                message: "Method not allowed"
            })
        };
    }

    try {

        const data = JSON.parse(event.body || "{}");

        const date = data.date || "Not selected";
        const time = data.time || "Not selected";
        const foods = Array.isArray(data.foods)
            ? data.foods.join(", ")
            : "Not selected";

        const apiKey = process.env.BREVO_API_KEY;
        const notifyEmail = process.env.NOTIFY_EMAIL;
        const senderEmail = process.env.SENDER_EMAIL;

        if (!apiKey || !notifyEmail || !senderEmail) {
            return {
                statusCode: 500,
                body: JSON.stringify({
                    success: false,
                    message: "Email configuration is missing"
                })
            };
        }

        const response = await fetch(
            "https://api.brevo.com/v3/smtp/email",
            {
                method: "POST",

                headers: {
                    "accept": "application/json",
                    "api-key": apiKey,
                    "content-type": "application/json"
                },

                body: JSON.stringify({

                    sender: {
                        name: "Date Invitation",
                        email: senderEmail
                    },

                    to: [
                        {
                            email: notifyEmail
                        }
                    ],

                    subject: "❤️ Someone accepted your date invitation!",

                    htmlContent: `
                        <div style="
                            font-family:Arial,sans-serif;
                            max-width:600px;
                            margin:auto;
                            padding:25px;
                            border-radius:20px;
                            background:#fff5f8;
                        ">

                            <h1 style="color:#7e3f58;">
                                ❤️ It's a Date!
                            </h1>

                            <p>
                                Someone just completed your date invitation.
                            </p>

                            <hr>

                            <p>
                                📅 <b>Date:</b> ${date}
                            </p>

                            <p>
                                ⏰ <b>Time:</b> ${time}
                            </p>

                            <p>
                                🍽️ <b>Food:</b> ${foods}
                            </p>

                            <hr>

                            <p style="color:#8e4b66;">
                                Your little plan has been confirmed. 💌
                            </p>

                        </div>
                    `
                })
            }
        );

        const result = await response.text();

        if (!response.ok) {

            console.error("Brevo error:", result);

            return {
                statusCode: 500,
                body: JSON.stringify({
                    success: false,
                    message: "Email could not be sent"
                })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true
            })
        };

    } catch (error) {

        console.error(error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: "Server error"
            })
        };
    }
};
