import { registerDecorator, type ValidationOptions } from 'class-validator';

// Stellar public keys: "G" + 55 base32 chars (RFC 4648, no padding).
const STELLAR_ADDRESS_PATTERN = /^G[A-Z2-7]{55}$/;

/** Validates a string looks like a Stellar Ed25519 public key (format only, not checksum). */
export function IsStellarAddress(validationOptions?: ValidationOptions) {
  return function decorate(object: object, propertyName: string) {
    registerDecorator({
      name: 'isStellarAddress',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return typeof value === 'string' && STELLAR_ADDRESS_PATTERN.test(value);
        },
        defaultMessage(): string {
          return `$property must be a valid Stellar public key (G... 56 characters)`;
        },
      },
    });
  };
}
