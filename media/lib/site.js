void (function() {
  function $$(selector, element = document) {
    return element.querySelectorAll(selector);
  }

  function h(tag, attrs, children) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      e.setAttribute(k, v);
    }
    for (const x of children) e.append(x);
    return e;
  }

  function* cycle(list) {
    while (true) {
      for (const item of list) yield item;
    }
  }

  function* enumerate(list, start = 0) {
    let i = start;
    for (const x of list) {
      yield [i, x];
      i += 1;
    }
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
  }

  function doEach(items, fn) {
    for (const item of items) {
      Promise.resolve(fn(item)).catch(error => console.error(error));
    }
  }

  function shuffle(items) {
    return items.slice().sort(_ => Math.random() - 0.5);
  }

  function format_string(format, value) {
    return format.replace(/%(\d+)d/g, (_, n) => {
      return value.toString().padStart(Number(n), "0")
    });
  }

  function load_image(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = (e) => {
        console.error(e);
        reject(e);
      }
      img.src = url;
    })
  }

  async function rotating_greeting(container) {
    const greetings = cycle(
      shuffle(JSON.parse(container.getAttribute("data-greetings") || "[]"))
    );
    const itemDelay =
      (Number(container.getAttribute("data-delay")) || 5) * 1000;

    for (const greeting of greetings) {
      await delay(itemDelay);
      container.textContent = greeting;
    }
  }

  async function hamburger_menu(container) {
    container.addEventListener("click", () => {
      const target = document.querySelector(
        container.getAttribute("data-target")
      );
      container.classList.toggle("is-active");
      target.classList.toggle("is-active");
    });
  }

  async function slide_show(container) {
    const start = Number(container.getAttribute("data-start"));
    const end = Number(container.getAttribute("data-end"));
    const format = container.getAttribute("data-format");
    let current = null;

    function show(element) {
      if (!element) return;
      if (current != null) current.classList.remove("rl-slide-show-current");
      element.classList.add("rl-slide-show-current");
      root.scrollTo({ left: element.offsetLeft, behavior: element.getAttribute("data-behavior") || "auto" });
      status.innerText = `${element.getAttribute("data-index")} / ${end}`;
      current = element;
    }

    const files = [];
    for (let i = start; i <= end; ++i) {
      const file = format_string(format, i);
      files.push(file);
    }

    container.classList.add("rl-slide-show-loading");
    container.innerText = "Loading...";
    try {
      await Promise.all(files.map(x => load_image(x)));
    } catch (e) {
      console.error(e);
      container.innerText = "An error occurred loading the images";
      return;
    }
    container.classList.remove("rl-slide-show-loading");
    container.innerText = "";

    const root = h("div", { class: "rl-slide-show-container" }, []);
    for (const [i, file] of enumerate(files, 1)) {
      const img = h("img", { src: file, "data-index": i }, []);
      root.append(img);
    }

    const navigation = h("div", { class: "rl-slide-show-navigation" }, []);
    const prev = h("button", { class: "rl-slide-show-button rl-slide-show-previous", title: "Previous slide" }, [
      h("span", { class: "icon is-large" }, [
        h("i", { class: "fas fa-2x fa-angle-left" }, [])
      ])
    ]);
    const next = h("button", { class: "rl-slide-show-button rl-slide-show-next", title: "Next slide" }, [
      h("span", { class: "icon is-large" }, [
        h("i", { class: "fas fa-2x fa-angle-right" }, [])
      ])
    ]);
    const status = h("div", { class: "rl-slide-show-status" }, []);
    navigation.append(prev, status, next);
    
    prev.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      show(current?.previousElementSibling);
    })

    next.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      show(current?.nextElementSibling);
    })

    document.addEventListener("keyup", (ev) => {
      if (ev.defaultPrevented) return;

      switch (ev.key) {
        case "ArrowLeft":
          show(current?.previousElementSibling);
          break;
        case "ArrowRight":
          show(current?.nextElementSibling);
          break;
        default:
          return;
      }

      ev.preventDefault();
      ev.stopPropagation();
    })
    
    container.append(root);
    container.append(navigation);
    show(root.firstElementChild);
  }

  doEach($$(".rl-greeting"), rotating_greeting);
  doEach($$(".navbar-burger"), hamburger_menu);
  doEach($$(".rl-slide-show"), slide_show);
})();
