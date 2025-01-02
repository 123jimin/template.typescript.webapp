export interface BuildParams {
    mode: 'dev'|'prod';
    serve: boolean;
    sourcemap: boolean|'linked'|'external'|'inline'|'both';
}