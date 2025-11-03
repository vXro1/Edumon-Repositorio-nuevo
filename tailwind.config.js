/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        blanco: '#FFFFFF',
        grisClaro: '#E2E8F0',
        grisMedio: '#718096',
        grisOscuro: '#2D3748',
        azulCielo: '#00B9F0',
        verdeLima: '#7AD107',
        fucsia: '#FE327B',
        celeste: '#01C9F4',
        naranja: '#FA6D00',
        amarillo: '#FED31F',
        azulOscuro: '#0082B3',
        fucsiaOscuro: '#D91E5B',
        verdeOscuro: '#5A9A05',
        exito: '#48BB78',
        error: '#F56565',
        advertencia: '#ED8936',
        info: '#4299E1',
      },
      boxShadow: {
        neum: '8px 8px 15px #d1d9e6, -8px -8px 15px #ffffff', // sombra neumórfica
        neumInset: 'inset 8px 8px 15px #d1d9e6, inset -8px -8px 15px #ffffff', // inset
      },
      borderRadius: {
        neum: '1rem',
        neumLg: '2rem',
      },
    },
  },
  plugins: [],
}
