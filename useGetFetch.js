import fetch from 'node-fetch';
// const fetch = global.fetch || require('node-fetch');

const Url = process.env.YAHVIPAY_ADMIN_BACKEND;

export const useGetFetch = async (endPoint, query = {}, includeApiKey = true) => {
     const apiKey = process.env.API_KEY;
    try {
        // Include API key in query if needed
        if (includeApiKey) {
            query.apiKey = apiKey;
        }

        const queryString = new URLSearchParams(query).toString();
        const url = `${Url}${endPoint}?${queryString}`;

        console.log("GET", url);

        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Failed to fetch data");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("API error:", error.message);
        throw error;
    }
};


