function SkillGroup({ group }) {
  return (
    <section className="skill-detail" aria-labelledby={`skill-heading-${group.id}`}>
      <div className="skill-detail__intro">
        <span aria-hidden="true">{group.number}</span>
        <div>
          <p className="graphic-label">Active category</p>
          <h2 id={`skill-heading-${group.id}`}>{group.label}</h2>
          <p>{group.descriptor}</p>
        </div>
      </div>

      <ul className="skill-detail__list" aria-label={`${group.label} skills`}>
        {group.skills.map((skill, index) => (
          <li key={skill} style={{ '--skill-index': index }}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{skill}</strong>
            <i aria-hidden="true" />
          </li>
        ))}
      </ul>
    </section>
  )
}

export default SkillGroup
