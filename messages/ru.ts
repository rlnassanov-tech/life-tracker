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
    directions: "Направления",
    todayShort: "сегодня",
    weekShort: "неделя",
    addEntry: "Запись",
    empty: "Нет активных направлений. Добавь их в настройках.",
  },

  entry: {
    newTitle: "Новая запись",
    editTitle: "Изменить запись",
    direction: "Направление",
    duration: "Сколько минут",
    minutes: "мин",
    what: "Что делал",
    whatPlaceholder: "Необязательно",
    note: "Заметка",
    addNote: "+ заметка",
    date: "Дата",
    today: "Сегодня",
    yesterday: "Вчера",
    save: "Сохранить",
    saved: "Записано",
    delete: "Удалить",
    deleteConfirm: "Удалить запись?",
    deleted: "Удалено",
  },

  direction: {
    week: "За неделю",
    month: "За месяц",
    history: "История",
    empty: "Пока нет записей",
    back: "Назад",
    archived: "В архиве",
  },

  settings: {
    theme: "Тема",
    dark: "Тёмная",
    light: "Светлая",
    logout: "Выйти",
    directions: "Направления",
    addDirection: "Добавить направление",
    archive: "Архив",
    newDirection: "Новое направление",
    editDirection: "Направление",
    name: "Название",
    icon: "Эмодзи",
    color: "Цвет",
    save: "Сохранить",
    toArchive: "В архив",
    fromArchive: "Вернуть из архива",
    up: "Выше",
    down: "Ниже",
  },

  common: {
    soon: "Скоро здесь что-то появится",
    error: "Что-то пошло не так",
  },
}
