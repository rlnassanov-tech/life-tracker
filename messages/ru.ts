// Все тексты интерфейса. Чтобы добавить английский — создать en.ts с той же структурой.
export const t = {
  appName: "Трекер",

  login: {
    title: "Вход",
    subtitle: "Пришлём письмо со ссылкой и кодом",
    email: "Email",
    emailPlaceholder: "you@example.com",
    send: "Получить код",
    sending: "Отправляем…",
    codeSent: (email: string) => `Письмо отправлено на ${email}. Введи код из письма или нажми ссылку в нём.`,
    code: "Код из письма",
    verify: "Войти",
    verifying: "Проверяем…",
    otherEmail: "Другой email",
    linkError: "Ссылка устарела или уже использована. Запроси новую.",
    demo: "Демо-режим: ключи Supabase ещё не подключены, поэтому вход без почты. Данные не сохраняются.",
    demoEnter: "Войти в демо",
  },

  onboarding: {
    title: "Как тебя зовут?",
    name: "Имя",
    save: "Продолжить",
  },

  nav: {
    today: "Сегодня",
    week: "Неделя",
    uni: "Универ",
    settings: "Настройки",
  },

  today: {
    greeting: (name: string) => `Привет, ${name}`,
  },

  settings: {
    theme: "Тема",
    dark: "Тёмная",
    light: "Светлая",
    logout: "Выйти",
  },

  common: {
    soon: "Скоро здесь что-то появится",
    error: "Что-то пошло не так",
  },
}
