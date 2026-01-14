// Vite asset imports (e.g., svg with ?url)
declare module '*.svg?url' {
	const url: string;
	export default url;
}

// ImportMeta env shims for Vite
interface ImportMetaEnv {
	readonly DEV: boolean;
	readonly PROD: boolean;
	readonly VITE_ENABLE_PROD_WIDGET?: string;
	readonly VITE_ENABLE_DEBUG_TOOLS?: string;
}
interface ImportMeta {
	readonly env: ImportMetaEnv;
}

// (Removed) process shim to avoid overriding Node types in server
