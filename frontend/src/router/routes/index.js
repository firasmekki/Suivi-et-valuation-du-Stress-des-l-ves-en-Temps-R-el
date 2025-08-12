// ** React Imports
import { Fragment, lazy } from 'react'
import { Navigate } from 'react-router-dom'
// ** Layouts
import BlankLayout from '@layouts/BlankLayout'
import VerticalLayout from '@src/layouts/VerticalLayout'
import HorizontalLayout from '@src/layouts/HorizontalLayout'
import LayoutWrapper from '@src/@core/layouts/components/layout-wrapper'

// ** Route Components
import PublicRoute from '@components/routes/PublicRoute'
import PrivateRoute from '@components/routes/PrivateRoute'

// ** Utils
import { isObjEmpty } from '@utils'

// ** Import ParentDashboard directly
import ParentDashboard from '../../views/parents/ParentDashboard'
import ParentProfile from '../../views/parents/ParentProfile'

// ** Lazy load NotesList
const NotesList = lazy(() => import('../../views/notes/NotesList'))

const getLayout = {
  blank: <BlankLayout />,
  vertical: <VerticalLayout />,
  horizontal: <HorizontalLayout />
}

// ** Document title
const TemplateTitle = '%s - Vuexy React Admin Template'

// ** Default Route
const DefaultRoute = '/login'

const Home = lazy(() => import('../../views/Home'))
const SecondPage = lazy(() => import('../../views/SecondPage'))
const Login = lazy(() => import('../../views/Login'))
const Register = lazy(() => import('../../views/Register'))
const ForgotPassword = lazy(() => import('../../views/ForgotPassword'))
const Error = lazy(() => import('../../views/Error'))
const AdminDashboard = lazy(() => import('../../views/admin/AdminDashboard'))
const AdminProfile = lazy(() => import('../../views/admin/AdminProfile'))
const Parents = lazy(() => import('../../views/parents/Parents'))
const ParentDetails = lazy(() => import('../../views/parents/ParentDetails'))
const EditParent = lazy(() => import('../../views/parents/EditParent'))

// ** Student Routes
const StudentsList = lazy(() => import('../../views/students/StudentsList'))
const StudentDetails = lazy(() => import('../../views/students/StudentDetails'))
const AddStudent = lazy(() => import('../../views/students/AddStudent'))
const EditStudent = lazy(() => import('../../views/students/EditStudent'))

// ** Teacher Routes
const TeachersList = lazy(() => import('../../views/teachers/TeachersList'))
const TeacherDetails = lazy(() => import('../../views/teachers/TeacherDetails'))
const AddTeacher = lazy(() => import('../../views/teachers/AddTeacher'))
const EditTeacher = lazy(() => import('../../views/teachers/EditTeacher'))
const TeacherDashboard = lazy(() => import('../../views/teachers/TeacherDashboard'))
const TeacherProfile = lazy(() => import('../../views/teachers/TeacherProfile'))

// ** Class Routes
const ClassesList = lazy(() => import('../../views/classes/ClassesList'))
const AddClasse = lazy(() => import('../../views/classes/AddClasse'))
const EditClasse = lazy(() => import('../../views/classes/EditClasse'))
const ClassStudentsDetails = lazy(() => import('../../views/classes/ClassStudentsDetails'))

// ** Merge Routes
const Routes = [
  {
    path: '/',
    index: true,
    element: <Navigate replace to={DefaultRoute} />
  },
  {
    path: '/admin-dashboard',
    element: <AdminDashboard />,
    meta: {
      layout: 'vertical',
      roles: ['admin'],
      publicRoute: false
    }
  },
  {
    path: '/admin/profile',
    element: <AdminProfile />,
    meta: {
      layout: 'vertical',
      roles: ['admin'],
      publicRoute: false
    }
  },
  {
    path: '/home',
    element: <Home />,
    meta: {
      layout: 'vertical',
      publicRoute: false,
      restricted: false
    }
  },
  {
    path: '/second-page',
    element: <SecondPage />
  },
  {
    path: '/login',
    element: <Login />,
    meta: {
      layout: 'blank',
      publicRoute: true,
      restricted: true
    }
  },
  {
    path: '/register',
    element: <Register />,
    meta: {
      layout: 'blank',
      publicRoute: true,
      restricted: true
    }
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
    meta: {
      layout: 'blank',
      publicRoute: true,
      restricted: true
    }
  },
  {
    path: '/error',
    element: <Error />,
    meta: {
      layout: 'blank',
      publicRoute: true
    }
  },
  // ** Student Routes
  {
    path: '/students',
    element: <StudentsList />,
    meta: {
      layout: 'vertical',
      roles: ['admin', 'enseignant']
    }
  },
  {
    path: '/student/:id',
    element: <StudentDetails />,
    meta: {
      layout: 'vertical',
      roles: ['admin', 'enseignant']
    }
  },
  {
    path: '/add-student',
    element: <AddStudent />,
    meta: {
      layout: 'vertical',
      roles: ['admin']
    }
  },
  {
    path: '/edit-student/:id',
    element: <EditStudent />,
    meta: {
      layout: 'vertical',
      roles: ['admin']
    }
  },
  // ** Teacher Routes
  {
    path: '/teachers',
    element: <TeachersList />,
    meta: {
      layout: 'vertical',
      roles: ['admin']
    }
  },
  {
    path: '/teacher-details/:id',
    element: <TeacherDetails />,
    meta: {
      layout: 'vertical',
      roles: ['admin']
    }
  },
  {
    path: '/add-teacher',
    element: <AddTeacher />,
    meta: {
      layout: 'vertical',
      roles: ['admin']
    }
  },
  {
    path: '/edit-teacher/:id',
    element: <EditTeacher />,
    meta: {
      layout: 'vertical',
      roles: ['admin']
    }
  },
  {
    path: '/teacher-dashboard',
    element: <TeacherDashboard />,
    meta: {
      layout: 'vertical',
      roles: ['enseignant']
    }
  },
  {
    path: '/teacher/profile',
    element: <TeacherProfile />,
    meta: {
      layout: 'vertical',
      roles: ['enseignant']
    }
  },
  // ** Class Routes
  {
    path: '/classes',
    element: <ClassesList />,
    meta: {
      layout: 'vertical',
      roles: ['admin', 'enseignant']
    }
  },
  {
    path: '/add-classe',
    element: <AddClasse />,
    meta: {
      layout: 'vertical',
      roles: ['admin']
    }
  },
  {
    path: '/edit-classe/:id',
    element: <EditClasse />,
    meta: {
      layout: 'vertical',
      roles: ['admin']
    }
  },
  {
    path: '/class-students/:id',
    element: <ClassStudentsDetails />,
    meta: {
      layout: 'vertical',
      roles: ['admin', 'enseignant']
    }
  },
  // ** Parent Routes
  {
    path: '/parent-dashboard',
    element: <ParentDashboard />,
    meta: {
      layout: 'vertical',
      roles: ['parent'],
      publicRoute: false
    }
  },
  {
    path: '/parent/profile',
    element: <ParentProfile />,
    meta: {
      layout: 'vertical',
      roles: ['parent'],
      publicRoute: false
    }
  },
  {
    path: '/parents',
    element: <Parents />,
    meta: {
      layout: 'vertical',
      roles: ['admin']
    }
  },
  {
    path: '/parent-details/:id',
    element: <ParentDetails />,
    meta: {
      layout: 'vertical',
      roles: ['admin']
    }
  },
  {
    path: '/edit-parent/:id',
    element: <EditParent />,
    meta: {
      layout: 'vertical',
      roles: ['admin']
    }
  },
  {
    path: '/notes',
    element: <NotesList />,
    meta: {
      layout: 'vertical',
      roles: ['admin', 'enseignant'],
      publicRoute: false
    }
  }
]

const getRouteMeta = route => {
  if (isObjEmpty(route.element.props)) {
    if (route.meta) {
      return { routeMeta: route.meta }
    } else {
      return {}
    }
  }
}

const getRoutes = (layout, isAuthenticated = false) => {
  const defaultLayout = layout || 'vertical'
  const userRole = localStorage.getItem('userRole')
  
  // DEBUG: Log userRole type and value
  console.log('DEBUG getRoutes - userRole from localStorage:', userRole, typeof userRole)
  console.log('DEBUG getRoutes - isAuthenticated:', isAuthenticated)

  // Filtrer les routes en fonction de l'authentification et du rôle
  let filteredRoutes = Routes.filter(route => {
    // Les routes publiques sont toujours accessibles
    if (route.meta?.publicRoute) {
      console.log(`ALLOWED: Route ${route.path} is public`)
      return true
    }
    
    // Si non authentifié, ne garder que les routes publiques
    if (!isAuthenticated) {
      console.log(`BLOCKED: Route ${route.path} - not authenticated`)
      return false
    }
    
    // Vérifier les restrictions de rôle
    if (route.meta?.roles && !route.meta.roles.includes(userRole)) {
      console.log(`BLOCKED: Route ${route.path} requires roles [${route.meta.roles}], user has role ${userRole}`)
      return false
    }
    
    // Si authentifié et pas de restriction de rôle ou rôle autorisé
    console.log(`ALLOWED: Route ${route.path} - authenticated and authorized`)
    return true
  })

  console.log('Routes filtrées:', filteredRoutes.map(r => r.path))

  // Mapper les routes filtrées avec les bons wrappers
  const LayoutRoutes = filteredRoutes.map(route => {
    let finalElement = route.element

    // Envelopper avec PrivateRoute ou PublicRoute selon le cas
    if (route.meta?.publicRoute) {
      finalElement = <PublicRoute route={route}>{route.element}</PublicRoute>
    } else {
      finalElement = <PrivateRoute route={route}>{route.element}</PrivateRoute>
    }

    // Envelopper avec LayoutWrapper si nécessaire
    if (!route.meta?.layout || route.meta.layout !== 'blank') {
      finalElement = (
        <LayoutWrapper {...getRouteMeta(route)}>
          {finalElement}
        </LayoutWrapper>
      )
    }

    // CORRECTION: Enlever le slash au début pour les routes enfants
    const childPath = route.path.startsWith('/') ? route.path.slice(1) : route.path

    return {
      ...route,
      path: childPath,
      element: finalElement
    }
  })

  // Ajoute une route catch-all à la fin
  LayoutRoutes.push({ path: '*', element: <Navigate to="/error" replace /> })

  const finalRoutes = [
    {
      path: '/',
      element: getLayout[defaultLayout],
      children: LayoutRoutes
    }
  ]

  console.log('Final routes structure:', finalRoutes)
  return finalRoutes
}

export { DefaultRoute, TemplateTitle, Routes, getRoutes }
