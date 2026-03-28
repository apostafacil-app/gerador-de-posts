declare module 'dom-to-image-more' {
  interface Options {
    width?: number
    height?: number
    style?: Record<string, string>
    scale?: number
    bgcolor?: string
    quality?: number
    useCORS?: boolean
    [key: string]: unknown
  }

  const domtoimage: {
    toBlob(node: Node, options?: Options): Promise<Blob>
    toPng(node: Node, options?: Options): Promise<string>
    toJpeg(node: Node, options?: Options): Promise<string>
    toSvg(node: Node, options?: Options): Promise<string>
    toCanvas(node: Node, options?: Options): Promise<HTMLCanvasElement>
  }

  export default domtoimage
}
