declare module 'mercadopago' {
  export function configure(options: { access_token: string }): void;
  
  export const preapproval: {
    create: (preference: any) => Promise<{ body: { id: string, init_point: string } }>;
  };
  
  export default {
    configure,
    preapproval
  };
} 