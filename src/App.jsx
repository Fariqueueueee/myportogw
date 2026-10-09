import { useEffect, useRef } from 'react'
import AppShell from './components/layout/AppShell.jsx'
import GameMenu from './components/navigation/GameMenu.jsx'
import ScreenTransition from './components/transitions/ScreenTransition.jsx'
import { navigationItems } from './data/navigation.js'
import { about } from './data/about.js'
import { profile } from './data/profile.js'
import { useMenuNavigation } from './hooks/useMenuNavigation.js'
import AboutScreen from './sections/About/AboutScreen.jsx'
import ContactScreen from './sections/Contact/ContactScreen.jsx'
import HomeScreen from './sections/Home/HomeScreen.jsx'
import ProjectsScreen from './sections/Projects/ProjectsScreen.jsx'
import ScreenPlaceholder from './sections/ScreenPlaceholder.jsx'
import SkillsScreen from './sections/Skills/SkillsScreen.jsx'

function App() {
  const {
    activeId,
    activeItem,
    activateSection,
    focusRequest,
    handleCovered,
    handleRevealed,
    isTransitioning,
    phase,
    requestedItem,
    selectedIndex,
    selectItem,
  } = useMenuNavigation(navigationItems)
  const screenRef = useRef(null)

  useEffect(() => {
    if (focusRequest === 0) return undefined

    const resetScrollPosition = () => {
      const root = document.documentElement
      const previousScrollBehavior = root.style.scrollBehavior
      root.style.scrollBehavior = 'auto'
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      root.style.scrollBehavior = previousScrollBehavior
    }

    resetScrollPosition()

    const frame = window.requestAnimationFrame(() => {
      resetScrollPosition()
      screenRef.current?.focus({ preventScroll: true })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [focusRequest])

  const screens = {
    home: <HomeScreen profile={profile} onNavigate={activateSection} />,
    projects: <ProjectsScreen />,
    skills: <SkillsScreen />,
    about: <AboutScreen profile={profile} content={about} />,
    contact: <ContactScreen profile={profile} />,
  }

  const screen = screens[activeId] ?? (
    <ScreenPlaceholder section={activeItem} onHome={() => activateSection('home')} />
  )

  return (
    <AppShell
      activeItem={activeItem}
      availability={profile.availability}
      isTransitioning={isTransitioning}
      onHome={() => activateSection('home')}
    >
      <ScreenTransition
        destination={requestedItem}
        phase={phase}
        onCovered={handleCovered}
        onRevealed={handleRevealed}
      />

      <main
        className={`interface-stage interface-stage--${activeId}`}
        aria-busy={isTransitioning}
      >
        <div
          className="interface-stage__screen"
          data-screen={activeId}
          key={activeId}
          ref={screenRef}
          tabIndex="-1"
          aria-label={`${activeItem.label} screen`}
        >
          {screen}
        </div>

        <GameMenu
          items={navigationItems}
          activeId={activeId}
          selectedIndex={selectedIndex}
          isTransitioning={isTransitioning}
          onActivate={activateSection}
          onSelect={selectItem}
        />
      </main>
    </AppShell>
  )
}

export default App
