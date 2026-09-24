/// <reference types="vite/client" />

declare module 'virtual:build-info' {
  const info: {
    hash: string;
    date: string;
    revisions: { hash: string; date: string; subject: string }[];
  };
  export default info;
}
