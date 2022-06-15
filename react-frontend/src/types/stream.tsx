export interface Stream {
  ownerName: string;
  audioStream?: MediaStream;
  videoStream?: MediaStream;
  metadata?: object;
}

export default Stream;
