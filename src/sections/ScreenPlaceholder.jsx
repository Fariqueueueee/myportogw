import BackgroundPattern from '../components/ui/BackgroundPattern.jsx'
import GraphicPanel from '../components/ui/GraphicPanel.jsx'
import RebelButton from '../components/ui/RebelButton.jsx'
import SectionHeading from '../components/ui/SectionHeading.jsx'

function ScreenPlaceholder({ section, onHome }) {
  return (
    <section className="placeholder-screen" aria-labelledby={`${section.id}-title`}>
      <BackgroundPattern className="placeholder-screen__pattern" density="regular" />
      <p className="placeholder-screen__index" aria-hidden="true">{section.number}</p>

      <div className="placeholder-screen__content">
        <SectionHeading
          id={`${section.id}-title`}
          number={section.number}
          eyebrow="Section preview"
          title={section.label}
          subtitle={section.descriptor}
        />

        <GraphicPanel variant="paper" rotation="right" className="placeholder-screen__panel">
          <p className="graphic-label graphic-label--dark">Content status / queued</p>
          <p className="type-title">The signal is being assembled.</p>
          <p>{section.placeholder}</p>
        </GraphicPanel>

        <RebelButton onClick={onHome}>Return home</RebelButton>
      </div>
    </section>
  )
}

export default ScreenPlaceholder
