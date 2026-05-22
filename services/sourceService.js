import * as cheerio from "cheerio";

function extractReadableText(html) {
  const $ = cheerio.load(html);

  $("script, style, noscript, svg, iframe, footer, nav, aside").remove();

  const compact = (value) => value.replace(/\s+/g, " ").trim();
  const firstMeta = (...selectors) =>
    selectors
      .map((selector) => $(selector).first().attr("content")?.trim())
      .find((value) => Boolean(value));
  const gatherText = (selector) =>
    $(selector)
      .toArray()
      .map((element) => compact($(element).text()))
      .filter(Boolean);

  const title =
    compact($("title").first().text()) ||
    compact(firstMeta('meta[property="og:title"]', 'meta[name="twitter:title"]', 'meta[name="title"]') || "") ||
    compact($("h1").first().text()) ||
    "Untitled page";

  const article = $("article").first();
  const main = $("main").first();
  const contentRoot = article.length > 0 ? article : main.length > 0 ? main : $("body");
  const primaryText = compact(contentRoot.text());
  const secondaryText = [
    ...gatherText("h1, h2, h3, h4"),
    ...gatherText("p"),
    ...gatherText("li"),
    ...gatherText("blockquote"),
    ...gatherText("figcaption"),
  ].join(" ").trim();
  const metaText = compact(
    firstMeta(
      'meta[property="og:description"]',
      'meta[name="description"]',
      'meta[name="twitter:description"]',
    ) || "",
  );
  const text = [primaryText, secondaryText, metaText].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();

  return { title, text };
}

function getSpaceXMissionSlug(targetUrl) {
  if (targetUrl.hostname !== "www.spacex.com" && targetUrl.hostname !== "spacex.com") {
    return null;
  }

  const match = targetUrl.pathname.match(/^\/launches\/([^/?#]+)/i);
  if (!match) {
    return null;
  }

  return match[1];
}

function extractSpaceXMissionText(mission) {
  const compact = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
  const textFromHtml = (value) => {
    const fragment = cheerio.load(`<div>${String(value ?? "")}</div>`);
    return fragment("div").text().replace(/\s+/g, " ").trim();
  };
  const lines = [];

  if (mission?.title) {
    lines.push(`Mission title: ${compact(mission.title)}`);
  }

  if (mission?.missionId) {
    lines.push(`Mission id: ${compact(mission.missionId)}`);
  }

  if (mission?.callToAction) {
    lines.push(`Call to action: ${compact(mission.callToAction)}`);
  }

  const paragraphs = Array.isArray(mission?.paragraphs)
    ? mission.paragraphs.map((item) => textFromHtml(item?.content)).filter(Boolean)
    : [];

  if (paragraphs.length > 0) {
    lines.push("");
    lines.push("Overview:");
    paragraphs.forEach((paragraph) => lines.push(`- ${paragraph}`));
  }

  const formatTimeline = (label, timeline) => {
    const entries = Array.isArray(timeline?.timelineEntries)
      ? timeline.timelineEntries
          .map((entry) => {
            const time = compact(entry?.time);
            const description = compact(entry?.description);
            return time && description ? `${time} ${description}` : description || time;
          })
          .filter(Boolean)
      : [];

    if (entries.length === 0) {
      return;
    }

    lines.push("");
    lines.push(`${label}:`);
    entries.forEach((entry) => lines.push(`- ${entry}`));
  };

  formatTimeline("Pre-launch timeline", mission?.preLaunchTimeline);
  formatTimeline("Post-launch timeline", mission?.postLaunchTimeline);

  if (Array.isArray(mission?.webcasts) && mission.webcasts.length > 0) {
    const webcastTitles = mission.webcasts
      .map((item) => compact(item?.title || item?.videoId || item?.streamingVideoType))
      .filter(Boolean);

    if (webcastTitles.length > 0) {
      lines.push("");
      lines.push("Webcasts:");
      webcastTitles.forEach((item) => lines.push(`- ${item}`));
    }
  }

  return {
    title: compact(mission?.title) || "SpaceX mission",
    text: lines.join("\n").trim(),
  };
}

export async function resolveSourceInput(value) {
  let contextText = value;
  let sourceLabel = "Pasted text";

  const looksLikeUrl = /^https?:\/\/\S+/i.test(value);
  if (!looksLikeUrl) {
    return { contextText, sourceLabel };
  }

  let targetUrl;

  try {
    targetUrl = new URL(value);
  } catch {
    throw Object.assign(new Error("Please enter a valid http:// or https:// URL."), { status: 400 });
  }

  if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
    throw Object.assign(new Error("Please enter a valid http:// or https:// URL."), { status: 400 });
  }

  const missionSlug = getSpaceXMissionSlug(targetUrl);

  if (missionSlug) {
    const missionResponse = await fetch(`https://content.spacex.com/api/spacex-website/missions/${missionSlug}`, {
      headers: {
        accept: "application/json",
        "user-agent": "AI Summarizer/1.0",
      },
    });

    if (missionResponse.ok) {
      const mission = await missionResponse.json();
      const { title, text } = extractSpaceXMissionText(mission);
      const trimmedText = text.slice(0, 12000);

      if (trimmedText) {
        return {
          contextText: trimmedText,
          sourceLabel: title,
        };
      }
    }
  }

  const pageResponse = await fetch(targetUrl.toString(), {
    redirect: "follow",
    headers: {
      "user-agent": "AI Summarizer/1.0",
      accept: "text/html,application/xhtml+xml",
    },
  });

  if (!pageResponse.ok) {
    throw Object.assign(new Error(`Failed to fetch the page. HTTP ${pageResponse.status}.`), { status: 502 });
  }

  const html = await pageResponse.text();
  const { title, text } = extractReadableText(html);
  const trimmedText = text.slice(0, 12000);

  if (!trimmedText) {
    throw Object.assign(
      new Error(
        "No readable text was found on that page. The site may be JavaScript-rendered, image-based, or blocked for server-side fetches.",
      ),
      { status: 400 },
    );
  }

  contextText = trimmedText;
  sourceLabel = title;

  return { contextText, sourceLabel };
}
