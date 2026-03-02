/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		fontFamily: {
  			mono: ['Fira Code', 'monospace'],
  			sans: ['Inter', 'system-ui', 'sans-serif'],
  		},
  		zIndex: {
  			'header': '1000',
  			'dropdown': '1100',
  			'modal': '1200',
  			'mobile-nav': '900',
  			'toast': '1300',
  		},
  		colors: {
  			border: 'rgba(255, 45, 146, 0.15)',
  			input: 'rgba(255, 45, 146, 0.15)',
  			ring: '#FF2D92',
  			background: '#030304',
  			foreground: '#f0f0f5',
  			'forum-bg': '#030304',
  			'forum-card': '#0d0d12',
  			'forum-card-alt': '#111118',
  			'forum-pink': '#FF2D92',
  			'forum-text': '#f0f0f5',
  			'forum-muted': '#6b6b80',
  			'forum-hover': '#16161f',
  			'forum-border': 'rgba(255, 45, 146, 0.15)',
  			'forum-accent': '#FF2D92',
  			primary: {
  				DEFAULT: '#FF2D92',
  				foreground: '#f0f0f5'
  			},
  			secondary: {
  				DEFAULT: '#1a1a24',
  				foreground: '#f0f0f5'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: '#1a1a24',
  				foreground: '#6b6b80'
  			},
  			accent: {
  				DEFAULT: '#FF2D92',
  				foreground: '#f0f0f5'
  			},
  			popover: {
  				DEFAULT: '#0d0d12',
  				foreground: '#f0f0f5'
  			},
  			card: {
  				DEFAULT: '#0d0d12',
  				foreground: '#f0f0f5'
  			},
  			sidebar: {
  				DEFAULT: '#0d0d12',
  				foreground: '#f0f0f5',
  				primary: '#FF2D92',
  				'primary-foreground': '#f0f0f5',
  				accent: '#1a1a24',
  				'accent-foreground': '#f0f0f5',
  				border: 'rgba(255, 45, 146, 0.15)',
  				ring: '#FF2D92'
  			}
  		},
  		borderRadius: {
  			lg: '6px',
  			md: '4px',
  			sm: '2px'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}