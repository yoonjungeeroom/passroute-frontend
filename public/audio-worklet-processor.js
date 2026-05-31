class PCMProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super()
    this.targetRate = 16000
    this.buffer = []
    this.sourceRate = options.processorOptions?.sampleRate || sampleRate
    this.ratio = this.sourceRate / this.targetRate
    // ~100ms worth of samples at target rate
    this.chunkSize = Math.floor(this.targetRate * 0.1)
  }

  process(inputs) {
    const input = inputs[0]
    if (!input || !input[0]) return true

    const channelData = input[0]

    // Downsample and accumulate
    for (let i = 0; i < channelData.length; i += this.ratio) {
      const idx = Math.floor(i)
      if (idx < channelData.length) {
        this.buffer.push(channelData[idx])
      }
    }

    // Send chunk when we have enough
    if (this.buffer.length >= this.chunkSize) {
      const samples = this.buffer.splice(0, this.chunkSize)
      const int16 = new Int16Array(samples.length)
      for (let i = 0; i < samples.length; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]))
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
      }
      this.port.postMessage(int16.buffer, [int16.buffer])
    }

    return true
  }
}

registerProcessor("pcm-processor", PCMProcessor)
