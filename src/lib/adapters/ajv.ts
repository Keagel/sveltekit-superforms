import Ajv from 'ajv';
import type { JSONSchema } from '$lib/jsonSchema.js';
import addFormats from 'ajv-formats';
import { memoize } from '$lib/memoize.js';

import type { ValidationAdapter } from './index.js';

function _ajv<T extends Record<string, unknown>>(
	schema: JSONSchema,
	options?: Ajv.Options
): ValidationAdapter<T> {
	const ajv = new Ajv.default({ allErrors: true, ...(options || {}) });
	// @ts-expect-error No type info exists
	addFormats(ajv);
	const validator = ajv.compile(schema);

	return {
		superFormValidationLibrary: 'ajv',
		validator,
		jsonSchema: schema,
		async customValidator(data: unknown) {
			if (validator(data)) {
				return {
					data: data as T,
					success: true
				};
			}
			return {
				issues: (validator.errors ?? []).map(
					({ message, instancePath }: { message?: string; instancePath?: string }) => ({
						message: message ?? '',
						path: (instancePath ?? '/').slice(1).split('/')
					})
				),
				success: false
			};
		}
	};
}

export const ajv = memoize(_ajv);