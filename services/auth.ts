type LoginResponse = {
	name: string;
	token: string;
};

function isLoginResponse(value: unknown): value is LoginResponse {
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	return (
		'name' in value &&
		typeof value.name === 'string' &&
		'token' in value &&
		typeof value.token === 'string'
	);
}

export async function login(email: string, password: string): Promise<LoginResponse> {
	const baseUrl = getApiBaseUrl();

	let response: Response;
	try {
		response = await fetch(`${baseUrl}/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password }),
		});
	} catch {
		throw new Error('Não foi possível conectar à API. Verifique a rede e o endereço do servidor.');
	}

	if (!response.ok) {
		throw new Error(await getApiErrorMessage(response, 'Não foi possível fazer login.'));
	}

	let result: unknown;
	try {
		result = await response.json();
	} catch {
		throw new Error('A API retornou uma resposta inválida.');
	}

	if (!isLoginResponse(result)) {
		throw new Error('A resposta da API não contém o nome e o token esperados.');
	}

	return result;
}

export async function requestPasswordReset(email: string): Promise<void> {
	const baseUrl = getApiBaseUrl();

	let response: Response;
	try {
		response = await fetch(`${baseUrl}/auth/forgot-password`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email }),
		});
	} catch {
		throw new Error('Não foi possível conectar à API. Verifique a rede e o endereço do servidor.');
	}

	if (!response.ok) {
		throw new Error(
			await getApiErrorMessage(response, 'Não foi possível solicitar a redefinição.'),
		);
	}
}

export async function resetPassword(code: string, newPassword: string): Promise<void> {
	const baseUrl = getApiBaseUrl();

	let response: Response;
	try {
		response = await fetch(`${baseUrl}/auth/reset-password`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ code, newPassword }),
		});
	} catch {
		throw new Error('Não foi possível conectar à API. Verifique a rede e o endereço do servidor.');
	}

	if (!response.ok) {
		throw new Error(await getApiErrorMessage(response, 'Não foi possível redefinir a senha.'));
	}
}

async function getApiErrorMessage(response: Response, fallback: string): Promise<string> {
	const responseText = await response.text();
	let detail = '';

	if (responseText) {
		try {
			const body: unknown = JSON.parse(responseText);
			detail = getErrorDetail(body);
		} catch {
			detail = '';
		}
	}

	if (response.status === 401 && !detail) {
		return 'E-mail ou senha inválidos.';
	}

	return detail
		? `${fallback} ${detail}`
		: `${fallback} (HTTP ${response.status}).`;
}

function getErrorDetail(value: unknown): string {
	if (typeof value === 'string') {
		return value;
	}

	if (Array.isArray(value)) {
		return value.map(getErrorDetail).filter(Boolean).join(' ');
	}

	if (typeof value !== 'object' || value === null) {
		return '';
	}

	for (const [key, nestedValue] of Object.entries(value)) {
		if (['message', 'detail', 'error', 'errors'].includes(key)) {
			const detail = getErrorDetail(nestedValue);
			if (detail) {
				return detail;
			}
		}
	}

	return '';
}

function getApiBaseUrl(): string {
	const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');
	if (!baseUrl) {
		throw new Error('Configure a URL da API em EXPO_PUBLIC_API_URL.');
	}

	return baseUrl;
}
