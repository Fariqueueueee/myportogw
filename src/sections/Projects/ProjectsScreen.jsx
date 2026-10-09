import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import BackgroundPattern from '../../components/ui/BackgroundPattern.jsx'
import StaggeredText from '../../components/transitions/StaggeredText.jsx'
import { projectCategories, projects } from '../../data/projects.js'
import ProjectCard from './ProjectCard.jsx'
import ProjectDetailDialog from './ProjectDetailDialog.jsx'

function ProjectsScreen() {
  const [activeCategory, setActiveCategory] = useState('All Projects')
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const triggerRef = useRef(null)
  const focusFrameRef = useRef(null)

  useEffect(() => () => window.cancelAnimationFrame(focusFrameRef.current), [])

  const filteredProjects = useMemo(() => projects.filter((project) => {
    const categoryMatches = activeCategory === 'All Projects' || project.category === activeCategory
    return categoryMatches && (!featuredOnly || project.featured)
  }), [activeCategory, featuredOnly])

  const featuredProjects = projects.filter((project) => project.featured)
  const collectionProjects = activeCategory === 'All Projects' && !featuredOnly
    ? projects.filter((project) => !project.featured)
    : filteredProjects

  const openProject = (project, trigger) => {
    triggerRef.current = trigger
    setSelectedProject(project)
  }

  const closeProject = useCallback(() => {
    setSelectedProject(null)
    focusFrameRef.current = window.requestAnimationFrame(() => triggerRef.current?.focus())
  }, [])

  return (
    <section className="projects-screen" aria-labelledby="projects-title">
      <BackgroundPattern className="projects-screen__pattern" density="slashes" />
      <span className="projects-screen__index" aria-hidden="true">02</span>

      <header className="projects-hero">
        <div className="projects-hero__meta">
          
          
        </div>
        <StaggeredText
          id="projects-title"
          className="projects-hero__title"
          lines={['Selected', 'Projects']}
          accentIndex={1}
        />
      </header>

      <section className="featured-projects" aria-labelledby="featured-projects-title">
        <div className="projects-section-label">
          <p className="graphic-label">Featured selection</p>
          <h2 id="featured-projects-title">Three lead projects</h2>
        </div>
        <div className="featured-projects__grid">
          {featuredProjects.map((project, index) => (
            <ProjectCard
              project={project}
              index={index}
              featured
              onOpen={openProject}
              key={project.id}
            />
          ))}
        </div>
      </section>

      <section className="project-collection" aria-labelledby="project-collection-title">
        <div className="project-collection__heading">
          <div className="projects-section-label">
            <p className="graphic-label">Filter the archive</p>
            <h2 id="project-collection-title">Project collection</h2>
          </div>
          <p aria-live="polite">
            {collectionProjects.length} project{collectionProjects.length === 1 ? '' : 's'} in collection
          </p>
        </div>

        <div className="project-filters" role="toolbar" aria-label="Project filters">
          <div className="project-filters__categories">
            {projectCategories.map((category) => (
              <button
                className={activeCategory === category ? 'is-active' : ''}
                type="button"
                aria-pressed={activeCategory === category}
                onClick={() => setActiveCategory(category)}
                key={category}
              >
                {category}
              </button>
            ))}
          </div>
          <button
            className={`project-filters__featured${featuredOnly ? ' is-active' : ''}`}
            type="button"
            aria-pressed={featuredOnly}
            onClick={() => setFeaturedOnly((current) => !current)}
          >
            <span aria-hidden="true">◆</span> Featured only
          </button>
        </div>

        {collectionProjects.length > 0 ? (
          <div className="project-collection__grid">
            {collectionProjects.map((project) => (
              <ProjectCard
                project={project}
                index={projects.indexOf(project)}
                onOpen={openProject}
                key={project.id}
              />
            ))}
          </div>
        ) : (
          <div className="project-empty" role="status">
            <span aria-hidden="true">×</span>
            <div>
              <h3>No signal found</h3>
              <p>There are no featured projects in this category yet. Try another filter or show the full collection.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('All Projects')
                setFeaturedOnly(false)
              }}
            >
              Reset filters
            </button>
          </div>
        )}
      </section>

      {selectedProject && (
        <ProjectDetailDialog project={selectedProject} onClose={closeProject} />
      )}
    </section>
  )
}

export default ProjectsScreen
