declare module 'bcryptjs' {
  export function compare(
    data: string | Buffer,
    encrypted: string
  ): Promise<boolean>;
  
  export function compareSync(
    data: string | Buffer,
    encrypted: string
  ): boolean;
  
  export function hash(
    data: string | Buffer,
    saltOrRounds: string | number
  ): Promise<string>;
  
  export function hashSync(
    data: string | Buffer,
    saltOrRounds: string | number
  ): string;
  
  export function genSalt(rounds?: number): Promise<string>;
  export function genSaltSync(rounds?: number): string;
  
  export function getRounds(encrypted: string): number;
  export function getSalt(encrypted: string): string;
}
