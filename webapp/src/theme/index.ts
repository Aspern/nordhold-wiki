import "vuetify/styles";
import "./tokens.css";

import { createVuetify, type ThemeDefinition } from "vuetify";

const nordholdTheme: ThemeDefinition = {
  dark: true,
  colors: {
    background: "#171c21",
    surface: "#222a31",
    primary: "#cf9f43",
    secondary: "#79d7ff",
    error: "#ff776d",
    info: "#79d7ff",
    success: "#7acb8b",
    warning: "#f0c96e",
    "on-background": "#f4ecd8",
    "on-surface": "#f4ecd8",
    "on-primary": "#171c21",
    "surface-variant": "#303941",
  },
  variables: {
    "border-color": "#49535b",
    "border-opacity": 1,
    "high-emphasis-opacity": 1,
    "medium-emphasis-opacity": 0.78,
  },
};

export function createWikiVuetify() {
  return createVuetify({
    defaults: {
      VBtn: {
        rounded: "lg",
        variant: "flat",
      },
      VCard: {
        elevation: 4,
        rounded: "xl",
      },
      VTextField: {
        density: "comfortable",
        variant: "outlined",
      },
    },
    theme: {
      defaultTheme: "nordhold",
      themes: { nordhold: nordholdTheme },
    },
  });
}

export type WikiVuetify = ReturnType<typeof createWikiVuetify>;
