function ProjectCard({ project, index, featured = false, onOpen }) {
  return (
    <article className={`project-card${featured ? ' project-card--featured' : ''}`}>
      <div className="project-card__trigger">
        <div className="project-card__visual" aria-hidden="true">
          <span>{String(index + 1).padStart(2, '0')}</span>
          <strong>{project.title.split(' ')[0]}</strong>
          <i />
        </div>

        <div className="project-card__body">
          <div className="project-card__meta">
            <span>{project.category}</span>
            <span>{project.status}</span>
          </div>
          <h3>{project.title}</h3>
          <p>{project.description}</p>
          <ul aria-label={`${project.title} technology stack`}>
            {project.stack.map((technology) => <li key={technology}>{technology}</li>)}
          </ul>
          <button
            className="project-card__action"
            type="button"
            aria-haspopup="dialog"
            aria-label={`Inspect ${project.title} project details`}
            onClick={(event) => onOpen(project, event.currentTarget)}
          >
            <span>Inspect project</span>
            <b aria-hidden="true">↗</b>
          </button>
        </div>
      </div>
    </article>
  )
}

export default ProjectCard
