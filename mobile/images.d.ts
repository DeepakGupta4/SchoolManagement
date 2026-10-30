/** Let TypeScript understand `import logo from "./x.png"` (metro returns an asset id). */
declare module "*.png" {
  const asset: number;
  export default asset;
}
