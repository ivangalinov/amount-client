import { getApiBase } from "../lib/api-base";

export class HTTPClient {

    private _apiEndpoint: string = getApiBase();

    async fetch(
        path: string,
        init?: RequestInit,
        searchParams?: URLSearchParams
    ): Promise<Response> {
        const headers = new Headers(init?.headers);

        if (init?.body != null && !headers.has("Content-Type") && !init.headers) {
            headers.set("Content-Type", "application/json");
        }

        let urlPath = `${this._apiEndpoint}/${path}`;

        if (searchParams) {

            urlPath += `?${searchParams.toString()}`
        }

        return fetch(urlPath, {
            ...init,
            credentials: "include",
            headers,
        });
    }
}
