import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

interface RequestBody {
  emergencyContact?: string;
  userLocation?: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  callSid?: string;
  smsSid?: string;
  error?: string;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "https://divya-drishti-web.vercel.app/",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const body: RequestBody = await req.json();
    const { emergencyContact, userLocation } = body;

    console.log("Emergency trigger request:", body);
    console.log("Environment check:", {
      hasSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasPhone: !!process.env.TWILIO_PHONE_NUMBER,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    });

    const location = userLocation || "Bhopal-Indore Highway , Madhya Pradesh";

    const twimlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Emergency alert activated. Someone at ${location} needs immediate help. This is an automated emergency call from the emergency response system.</Say>
    <Pause length="2"/>
    <Say voice="alice">Emergency location is ${location}. Time of alert is ${new Date().toLocaleString()}. Please send assistance immediately.</Say>
    <Pause length="1"/>
    <Say voice="alice">This message will repeat. Emergency location is ${location}. Please respond as soon as possible.</Say>
</Response>`;

    console.log("TwiML being sent:", twimlContent);

    const call = await client.calls.create({
      twiml: twimlContent,
      to: emergencyContact || "+918530480982",
      from: process.env.TWILIO_PHONE_NUMBER!,
    });

    const smsMessage = `EMERGENCY! Help at: ${location.substring(
      0,
      30
    )}... Time: ${new Date().getHours()}:${String(
      new Date().getMinutes()
    ).padStart(2, "0")} RESPOND NOW!`;

    console.log("Sending SMS to:", emergencyContact || "+918530480982");
    console.log("From number:", process.env.TWILIO_PHONE_NUMBER);
    console.log("SMS message:", smsMessage);
    console.log("SMS message length:", smsMessage.length);

    const sms = await client.messages.create({
      body: smsMessage,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: emergencyContact || "+91XXXXXXXX",
    });

    console.log("SMS sent successfully:", sms.sid);

    return NextResponse.json(
      {
        success: true,
        message: "Emergency alert sent successfully",
        callSid: call.sid,
        smsSid: sms.sid,
      },
      {
        status: 200,
        headers: corsHeaders(),
      }
    );
  } catch (error: any) {
    console.error("Emergency trigger error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to send emergency alert",
        error: error.message,
      },
      {
        status: 500,
        headers: corsHeaders(),
      }
    );
  }
}
