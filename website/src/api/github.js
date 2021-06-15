import axios from 'axios';

const AxiosInstance = axios.create({
    headers: { 'Accept': 'application/vnd.github.v3+json' },
});

function bindApiCall({ url, config, errorMessage }) {
    try {
        const apiCall = AxiosInstance.get(url, {
            ...config,
            validateStatus: function (status) {
                return status < 500; // Resolve only if the status code is less than 500
            }
        })

        return apiCall
    } catch (error) {
        console.log(errorMessage, error.message)
    }
}

async function getAccessToken(code) {
    const accessToken = await bindApiCall({
        url: '/github-proxy/login/oauth/access_token',
        config: {
            params: {
                code,
                client_id: process.env.REACT_APP_CLIENT_ID,
                client_secret: process.env.REACT_APP_CLIENT_SECRET,
            },
            errorMessage: 'error getAccessToken'
        }
    })

    return accessToken.data
}

export async function getUser(access_token) {
    const user = await bindApiCall({
        url: '/github-api-proxy/user',
        config: {
            headers: { Authorization: `token ${access_token}` },
        },
        errorMessage: 'error getUser'
    })

    return {
        login: user.data?.login,
        error: user.data?.error_description,
        status: user.status
    }

}

export async function checkUserCollaboratorStatus(code) {
    const { access_token } = await getAccessToken(code)
    const { login } = await getUser(access_token)

    const isUserCollaborator = await bindApiCall({
        url: `/docs-access/${login}`,
        errorMessage: 'error checkUserCollaboratorStatus'
    })

    return {
        isAllowed: isUserCollaborator.data,
        access_token
    }
}