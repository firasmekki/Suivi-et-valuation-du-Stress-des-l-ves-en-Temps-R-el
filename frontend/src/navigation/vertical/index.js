import { Home, Users, UserPlus, List, BookOpen, Calendar, Book, User, UserCheck, FileText } from 'react-feather'

// Fonction pour filtrer les éléments du menu selon le rôle
const filterMenuByRole = (navigation, role) => {
  // Si pas de rôle, retourner un menu vide
  if (!role) return []

  // Si c'est un admin, il a accès à tout
  if (role === 'admin') return navigation

  // Pour les enseignants, on filtre les éléments autorisés
  if (role === 'enseignant') {
    return navigation.filter(item => {
      // Garder l'en-tête du menu, l'accueil et le profil
      if (item.header || item.id === 'home' || item.id === 'profile') return true

      // Accès aux classes, élèves et notes
      return ['classes', 'students', 'notes'].includes(item.id)
    }).map(item => {
      // Si c'est l'accueil, rediriger vers le dashboard enseignant
      if (item.id === 'home') {
        return {
          ...item,
          navLink: '/teacher-dashboard'
        }
      }
      // Si c'est un élément avec des sous-menus, filtrer les sous-menus
      if (item.children) {
        return {
          ...item,
          children: item.children.filter(child => 
            ['studentsList', 'classesList'].includes(child.id)
          )
        }
      }
      return item
    })
  }

  // Pour les parents, on ne garde que les éléments spécifiques
  if (role === 'parent') {
    return navigation.filter(item => {
      // Garder l'en-tête du menu
      if (item.header) return true
      // Garder uniquement Accueil et Mon Profil
      return ['home', 'profile'].includes(item.id)
    }).map(item => {
      // Si c'est l'accueil, rediriger vers le dashboard parent
      if (item.id === 'home') {
        return {
          ...item,
          navLink: '/parent-dashboard'
        }
      }
      // Si c'est le profil, rediriger vers le profil parent
      if (item.id === 'profile') {
        return {
          ...item,
          navLink: '/parent/profile'
        }
      }
      return item
    })
  }

  // Par défaut, retourner un menu vide
  return []
}

const getNavigation = (role) => {
  // Si pas de rôle, retourner un menu vide
  if (!role) return []

  const baseNavigation = [
    {
      header: 'Menu Principal'
    },
    {
      id: 'home',
      title: 'Accueil',
      icon: <Home size={20} />,
      navLink: role === 'enseignant' ? '/teacher-dashboard' : '/admin-dashboard'
    },
    {
      id: 'profile',
      title: 'Mon Profil',
      icon: <User size={20} />,
      navLink: role === 'admin' ? '/admin/profile' : role === 'enseignant' ? '/teacher/profile' : '/profile'
    },
    {
      id: 'notes',
      title: 'Notes',
      icon: <FileText size={20} />,
      navLink: '/notes'
    },
    {
      id: 'students',
      title: 'Élèves',
      icon: <Users size={20} />,
      children: [
        {
          id: 'studentsList',
          title: 'Liste des élèves',
          icon: <List size={20} />,
          navLink: '/students'
        },
        {
          id: 'addStudent',
          title: 'Ajouter un élève',
          icon: <UserPlus size={20} />,
          navLink: '/add-student'
        }
      ]
    },
    {
      id: 'teachers',
      title: 'Enseignants',
      icon: <Users size={20} />,
      children: [
        {
          id: 'teachersList',
          title: 'Liste des enseignants',
          icon: <List size={20} />,
          navLink: '/teachers'
        },
        {
          id: 'addTeacher',
          title: 'Ajouter un enseignant',
          icon: <UserPlus size={20} />,
          navLink: '/add-teacher'
        }
      ]
    },
    {
      id: 'classes',
      title: 'Classes',
      icon: <BookOpen size={20} />,
      children: [
        {
          id: 'classesList',
          title: 'Liste des classes',
          icon: <List size={20} />,
          navLink: '/classes'
        },
        {
          id: 'addClasse',
          title: 'Ajouter une classe',
          icon: <UserPlus size={20} />,
          navLink: '/add-classe'
        }
      ]
    },
    {
      id: 'parents',
      title: 'Parents',
      icon: <Users size={20} />,
      navLink: '/parents'
    }
  ]

  // Navigation spécifique pour les administrateurs
  if (role === 'admin') {
    return baseNavigation
  }

  // Navigation spécifique pour les enseignants
  if (role === 'enseignant') {
    return [
      {
        header: 'Menu Principal'
      },
      {
        id: 'home',
        title: 'Accueil',
        icon: <Home size={20} />,
        navLink: '/teacher-dashboard'
      },
      {
        id: 'profile',
        title: 'Mon Profil',
        icon: <User size={20} />,
        navLink: '/teacher/profile'
      },
      {
        id: 'classes',
        title: 'Classes',
        icon: <BookOpen size={20} />,
        navLink: '/classes'
      },
      {
        id: 'students',
        title: 'Élèves',
        icon: <Users size={20} />,
        navLink: '/students'
      },
      {
        id: 'notes',
        title: 'Notes',
        icon: <FileText size={20} />,
        navLink: '/notes'
      }
    ]
  }

  // Navigation spécifique pour les parents
  if (role === 'parent') {
    baseNavigation.push(
      {
        title: 'Mes enfants',
        icon: <Users size={20} />,
        navLink: '/parent-dashboard'
      }
    )
  }

  return filterMenuByRole(baseNavigation, role)
}

export default getNavigation
