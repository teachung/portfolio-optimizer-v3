import { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context) => {
    // 模擬返回安全係數 1.0
    return new Response(JSON.stringify({ factor: 1.0 }), {
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        status: 200
    });
};

export const config: Config = {
    path: "/.netlify/functions/get_security_factor"
};