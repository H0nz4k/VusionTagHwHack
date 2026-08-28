(() => {
  const rootNode = { name: "workspace", dirs: {}, files: {} };

  function makeDir(name, node) {
    return {
      name,
      getDirectoryHandle(n, opts) {
        if (!node.dirs[n]) {
          if (!opts || !opts.create) {
            const err = new Error("NotFoundError");
            err.name = "NotFoundError";
            return Promise.reject(err);
          }
          node.dirs[n] = { name: n, dirs: {}, files: {} };
        }
        return Promise.resolve(makeDir(n, node.dirs[n]));
      },
      getFileHandle(n, opts) {
        if (!node.files[n]) {
          if (!opts || !opts.create) {
            const err = new Error("NotFoundError");
            err.name = "NotFoundError";
            return Promise.reject(err);
          }
          node.files[n] = { name: n, data: new Uint8Array() };
        }
        const fileNode = node.files[n];
        return Promise.resolve({
          name: n,
          createWritable() {
            const chunks = [];
            return Promise.resolve({
              write(data) {
                if (typeof data === "string") chunks.push(new TextEncoder().encode(data));
                else chunks.push(new Uint8Array(data));
                return Promise.resolve();
              },
              close() {
                let len = 0;
                for (const c of chunks) len += c.byteLength;
                const out = new Uint8Array(len);
                let o = 0;
                for (const c of chunks) {
                  out.set(c, o);
                  o += c.byteLength;
                }
                fileNode.data = out;
                return Promise.resolve();
              },
            });
          },
          getFile() {
            return Promise.resolve(new File([fileNode.data], n));
          },
        });
      },
      async *values() {
        for (const n of Object.keys(node.dirs)) yield { kind: "directory", name: n };
        for (const n of Object.keys(node.files)) yield { kind: "file", name: n };
      },
      queryPermission() {
        return Promise.resolve((window.__TAGSTUDIO_E2E__ && window.__TAGSTUDIO_E2E__.permission) || "granted");
      },
      requestPermission() {
        return Promise.resolve((window.__TAGSTUDIO_E2E__ && window.__TAGSTUDIO_E2E__.permission) || "granted");
      },
    };
  }

  function listFiles(node, prefix) {
    const names = [];
    for (const n of Object.keys(node.files)) names.push(prefix + n);
    for (const n of Object.keys(node.dirs)) names.push(...listFiles(node.dirs[n], prefix + n + "/"));
    return names;
  }

  window.__TAGSTUDIO_E2E__ = {
    disableFs: false,
    permission: "granted",
    abortPicker: false,
    dump() {
      return listFiles(rootNode, "");
    },
  };

  window.showDirectoryPicker = async function showDirectoryPicker() {
    if (window.__TAGSTUDIO_E2E__ && window.__TAGSTUDIO_E2E__.abortPicker) {
      const err = new Error("The user aborted a request.");
      err.name = "AbortError";
      throw err;
    }
    return makeDir("workspace", rootNode);
  };
})();
