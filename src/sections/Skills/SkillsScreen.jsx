import { useRef, useState } from 'react'
import BackgroundPattern from '../../components/ui/BackgroundPattern.jsx'
import StaggeredText from '../../components/transitions/StaggeredText.jsx'
import { skillGroups } from '../../data/skills.js'
import SkillGroup from './SkillGroup.jsx'

function SkillsScreen() {
  const [activeId, setActiveId] = useState(skillGroups[0].id)
  const tabRefs = useRef([])
  const activeGroup = skillGroups.find((group) => group.id === activeId) ?? skillGroups[0]

  const selectByIndex = (index) => {
    const normalizedIndex = (index + skillGroups.length) % skillGroups.length
    setActiveId(skillGroups[normalizedIndex].id)
    tabRefs.current[normalizedIndex]?.focus()
  }

  const handleTabKeyDown = (event, index) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      selectByIndex(index + 1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      selectByIndex(index - 1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      selectByIndex(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      selectByIndex(skillGroups.length - 1)
    }
  }

  return (
    <section className="skills-screen" aria-labelledby="skills-title">
      <BackgroundPattern className="skills-screen__pattern" density="compact" />
      <span className="skills-screen__index" aria-hidden="true">03</span>

      <header className="skills-hero">
        <div className="skills-hero__copy">

        </div>
        <StaggeredText
          id="skills-title"
          className="skills-hero__title"
          lines={['Skills', 'System']}
          accentIndex={0}
        />
      </header>

      <div className="skill-category-nav" role="tablist" aria-label="Skill categories">
        {skillGroups.map((group, index) => (
          <button
            id={`skill-tab-${group.id}`}
            className={activeId === group.id ? 'is-active' : ''}
            type="button"
            role="tab"
            aria-selected={activeId === group.id}
            aria-controls="skills-panel"
            tabIndex={activeId === group.id ? 0 : -1}
            onClick={() => setActiveId(group.id)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
            ref={(element) => { tabRefs.current[index] = element }}
            key={group.id}
          >
            <span>{group.number}</span>
            <strong>{group.label}</strong>
            <i aria-hidden="true">↗</i>
          </button>
        ))}
      </div>

      <div
        id="skills-panel"
        className="skill-panel"
        role="tabpanel"
        aria-labelledby={`skill-tab-${activeGroup.id}`}
        key={activeGroup.id}
      >
        <SkillGroup group={activeGroup} />
      </div>

    </section>
  )
}

export default SkillsScreen
