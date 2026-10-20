import Foundation
import AVFoundation
import Vision
let url=URL(fileURLWithPath:CommandLine.arguments[1]);let asset=AVURLAsset(url:url)
let reader=try AVAssetReader(asset:asset)
let track=asset.tracks(withMediaType:.video)[0]
let output=AVAssetReaderTrackOutput(track:track,outputSettings:[kCVPixelBufferPixelFormatTypeKey as String:kCVPixelFormatType_32BGRA])
reader.add(output);reader.startReading();var n=0;var found=[[String:Any]]()
while let sample=output.copyNextSampleBuffer(){
 defer{n+=1};guard let pixel=CMSampleBufferGetImageBuffer(sample) else{continue}
 let req=VNDetectFaceRectanglesRequest();try VNImageRequestHandler(cvPixelBuffer:pixel,options:[:]).perform([req])
 for f in req.results ?? [] {let b=f.boundingBox;if b.width>0.09 && b.height>0.05 {found.append(["t":CMTimeGetSeconds(CMSampleBufferGetPresentationTimeStamp(sample)),"x":b.minX,"y":b.minY,"w":b.width,"h":b.height])}}
}
let data=try JSONSerialization.data(withJSONObject:["frames":n,"faces":found],options:[.prettyPrinted]);print(String(data:data,encoding:.utf8)!)
