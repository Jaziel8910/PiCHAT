

export const MODEL_IDS: string[] = [
    "openrouter/auto",
    // OpenAI
    "openrouter:openai/gpt-4o",
    "openrouter:openai/gpt-4o-mini",
    "openrouter:openai/gpt-4-turbo",
    "openrouter:openai/gpt-3.5-turbo",
    
    // Anthropic
    "openrouter:anthropic/claude-3.5-sonnet-20240620",
    "openrouter:anthropic/claude-3-opus-20240229",
    "openrouter:anthropic/claude-3-haiku-20240307",
    
    // Google
    "openrouter:google/gemini-2.5-pro",
    "openrouter:google/gemini-2.5-flash",
    "openrouter:google/gemma-2-9b-it:free",
    "openrouter:google/gemma-2-27b-it",

    // Meta
    "openrouter:meta-llama/llama-3.1-405b-instruct",
    "openrouter:meta-llama/llama-3.1-70b-instruct",
    "openrouter:meta-llama/llama-3.1-8b-instruct",
    "meta-llama/Llama-3.2-90b-vision-instruct",
    "meta-llama/Llama-3.2-11b-vision-instruct",
    "meta-llama/Llama-3.2-1B-Instruct",

    // Mistral
    "openrouter:mistralai/mistral-large",
    "openrouter:mistralai/codestral-latest",
    "openrouter:mistralai/mixtral-8x22b-instruct",
    "openrouter:mistralai/mistral-7b-instruct",

    // xAI
    "openrouter:x-ai/grok-4",
    "openrouter:x-ai/grok-4-fast:free",

    // Qwen (Alibaba)
    "Qwen/Qwen2.5-VL-72B-Instruct",
    "Qwen/Qwen2.5-72B-Instruct",
    "Qwen/Qwen2.5-Coder-32B-Instruct",
    "Qwen/Qwen2.5-7B-Instruct-Turbo",

    // Other
    "openrouter:deepseek/deepseek-coder",
    "openrouter:perplexity/sonar-pro",
    "openrouter:microsoft/phi-3-medium-128k-instruct",
    "openrouter:cohere/command-r-plus",

    // Image Models (handled separately, but good to have)
    "dall-e-3",
    "gpt-image-1",
    "openrouter:google/gemini-2.5-flash-image-preview",
];
