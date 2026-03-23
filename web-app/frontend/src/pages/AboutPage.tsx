import { Brain, Camera, Zap, Shield, Github } from 'lucide-react'

const steps = [
  {
    icon: Camera,
    title: 'Camera Access',
    description:
      'Your browser requests camera permission. The video stream never leaves your device — no frames are uploaded to any server.',
  },
  {
    icon: Brain,
    title: 'Face Detection',
    description:
      'TinyFaceDetector (from face-api.js) locates faces in each frame. Runs at up to 150ms intervals for real-time performance.',
  },
  {
    icon: Zap,
    title: 'Emotion Classification',
    description:
      'FaceExpressionNet classifies 7 emotions: neutral, happy, sad, angry, fearful, disgusted, and surprised. Returns confidence scores for all 7 simultaneously.',
  },
]

const stack = [
  { name: 'React 18', description: 'UI framework' },
  { name: 'TypeScript', description: 'Type safety' },
  { name: 'Vite', description: 'Build tool' },
  { name: 'Tailwind CSS', description: 'Styling' },
  { name: 'face-api.js', description: 'Face detection + emotion recognition' },
  { name: 'TensorFlow.js', description: 'ML inference in-browser' },
  { name: 'Chart.js', description: 'Analytics charts' },
  { name: 'Framer Motion', description: 'Animations' },
  { name: 'Supabase', description: 'Auth + data persistence' },
  { name: 'Netlify', description: 'Deployment' },
]

export function AboutPage() {
  return (
    <div className="max-w-[760px] mx-auto px-6 pt-8 pb-12">
      {/* Header */}
      <section className="mb-12">
        <h1 className="text-2xl font-semibold mb-3">About EmoVision</h1>
        <p className="text-[15px] text-text-secondary leading-[1.7]">
          EmoVision is a real-time facial emotion analysis tool that runs entirely in your browser.
          Built using face-api.js and TensorFlow.js, it detects 7 emotions from your camera feed
          with zero data sent to any server.
        </p>
      </section>

      {/* How it works */}
      <section className="mb-12">
        <h2 className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-muted mb-6">
          How It Works
        </h2>
        <div className="flex flex-col gap-6">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-[8px] bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                  <step.icon className="w-4 h-4 text-accent" />
                </div>
                {i < steps.length - 1 && (
                  <div className="w-px flex-1 bg-border-subtle min-h-[24px]" />
                )}
              </div>
              <div className="pb-6">
                <h3 className="text-[14px] font-semibold mb-1">{step.title}</h3>
                <p className="text-[13px] text-text-secondary leading-[1.6]">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* The Model */}
      <section className="mb-12 p-5 bg-surface border border-border-subtle rounded-[8px]">
        <h2 className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-muted mb-4">
          The Model
        </h2>
        <div className="flex flex-col gap-4">
          <div>
            <span className="text-[13px] font-semibold text-accent font-mono">TinyFaceDetector</span>
            <p className="text-[13px] text-text-secondary mt-1 leading-[1.6]">
              A lightweight, fast model for locating face bounding boxes in video frames. Trades
              some accuracy for speed — ideal for real-time applications.
            </p>
          </div>
          <div className="border-t border-border-subtle pt-4">
            <span className="text-[13px] font-semibold text-accent font-mono">FaceExpressionNet</span>
            <p className="text-[13px] text-text-secondary mt-1 leading-[1.6]">
              A convolutional neural network trained on facial expression datasets. Outputs probability
              scores for all 7 emotion classes simultaneously. Runs in TensorFlow.js entirely
              client-side.
            </p>
          </div>
          <div className="border-t border-border-subtle pt-4">
            <span className="text-[13px] font-semibold text-accent font-mono">FaceLandmark68Net</span>
            <p className="text-[13px] text-text-secondary mt-1 leading-[1.6]">
              Detects 68 facial landmark points used as input features for expression classification.
            </p>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="mb-12">
        <h2 className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-muted mb-4">
          Tech Stack
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {stack.map((item) => (
            <div key={item.name} className="flex items-center gap-3 py-2 border-b border-border-subtle">
              <span className="text-[13px] font-semibold text-text-primary font-mono min-w-[130px]">
                {item.name}
              </span>
              <span className="text-[12px] text-text-muted">{item.description}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy */}
      <section className="mb-12 p-5 bg-success/5 border border-success/20 rounded-[8px]">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-success" />
          <h2 className="text-[13px] font-semibold text-success">Privacy First</h2>
        </div>
        <p className="text-[13px] text-text-secondary leading-[1.7]">
          All face detection and emotion classification happens locally in your browser using
          TensorFlow.js. No video frames, face data, or emotion scores are ever transmitted to
          any server. Your camera stream stays on your device.
        </p>
      </section>

      {/* Footer links */}
      <div className="flex items-center gap-4">
        <a
          href="https://github.com/Pratyush-Padhy/emotion-detection-cnn"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[13px] text-text-secondary hover:text-text-primary transition-colors duration-150"
        >
          <Github className="w-4 h-4" />
          View on GitHub
        </a>
      </div>
    </div>
  )
}
