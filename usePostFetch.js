import dotenv from 'dotenv';
dotenv.config();
import fetch from 'node-fetch';
// const fetch = global.fetch || require('node-fetch');

// ✅ Use process.env for apiKey and base URL
const Url = process.env.YAHVIPAY_ADMIN_BACKEND;

export  const usePostFetch = async (endPoint, data) => {
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
        throw new Error("API_KEY not set in environment variables");
    }

    const payLoad = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
             "x-db-name": "Gokul_testing"
        },
        body: JSON.stringify({
            ...data,
        }),
    };
    // console.log("request:", JSON.stringify({
    //     ...data,
    // }, null, 2));

    try {
        console.log(`POST ${Url}${endPoint}`);
        const response = await fetch(`${Url}${endPoint}`, payLoad);

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err);
        }

        const result = await response.json();
        // console.log(result)
        return result;
    } catch (error) {
        console.error("API error:", error);
        throw error;
    }
};

 
