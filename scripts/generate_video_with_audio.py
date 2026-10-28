import os
import sys
import subprocess
import pyttsx3
import imageio_ffmpeg

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

def main():
    print("[Video] Generating voice-over narration and audio-video mix for HabitFlow...")
    demo_dir = r"c:\Users\vedpr\Desktop\New folder\docs\demo"
    os.makedirs(demo_dir, exist_ok=True)

    wav_path = os.path.join(demo_dir, "narration.wav")
    temp_mp4 = os.path.join(demo_dir, "habitflow-temp.mp4")
    final_mp4 = os.path.join(demo_dir, "habitflow-demo.mp4")

    # If final_mp4 exists from previous step, use it as video source
    video_source = final_mp4
    if not os.path.exists(video_source):
        print(f"Error: {video_source} not found.")
        return

    # Narration script covering 3m31s (~211s)
    narration_text = (
        "Welcome to HabitFlow, a production quality full stack habit tracker with intelligent streaks. "
        "Traditional habit trackers fail users because of rigid daily expectations. "
        "Real life routines include varied schedules, such as daily rituals, specific weekdays like gym workouts on Monday, Wednesday, and Friday, "
        "or weekly targets like reading three times per week. "
        "HabitFlow features an intelligent, timezone safe Schedule Engine that evaluates streaks strictly on eligible scheduled occurrences. "
        "Unscheduled days, like Tuesday for a Monday, Wednesday, Friday habit, will never unfairly break your streak. "
        "We begin on the authentication screen with the convenient one-click demo login. "
        "Clicking Log In with Demo Account takes us directly into the personalized dashboard. "
        "The dashboard displays a localized greeting, the current local date, an interactive daily progress indicator, "
        "and summary metric cards highlighting active habits, current streak records, and all-time best streaks. "
        "Below the metrics, a seven day activity velocity chart shows habit check in momentum over the week. "
        "In the scheduled habits section, users can mark today's habits complete with a single click. "
        "Notice the vibrant completion checkmark, streak increment, and instant toast notification. "
        "Clicking again allows users to undo check-ins seamlessly. "
        "Next, we explore the habit details page. "
        "Here, HabitFlow displays the full habit profile, reminder time, and lifetime streak highlights. "
        "A signature feature is the seven day quick correction strip, which allows users to retroactively mark or correct check-ins "
        "for today and any date within the past seven calendar days, while strictly rejecting future dates. "
        "Below this, the six month consistency heatmap displays twenty-six calendar weeks, representing over one hundred and eighty days. "
        "Each cell clearly distinguishes completed days, missed scheduled days, unscheduled rest days, and future dates with interactive tooltips and an accessible legend. "
        "Moving to the statistics page, HabitFlow provides comprehensive thirty day analytics. "
        "The overall completion rate is calculated using a robust formula that safely avoids division by zero. "
        "Interactive charts visualize daily check-in volume and compare performance across different habits. "
        "On the habit management page, users can filter habits by schedule type, search by title, and archive habits without losing any historical data. "
        "Archived habits can be viewed and restored at any time. "
        "One of the key technical challenges solved in this project was timezone correctness. "
        "Instead of fragile UTC date slicing, calendar dates are normalized using the user's configured IANA timezone and date-fns, "
        "ensuring zero date shifts near midnight. "
        "With a verified suite of thirty-one automated tests, clean architecture, and responsive dark and light modes, "
        "HabitFlow is production ready and built for lasting personal consistency. Thank you for watching."
    )

    print("[Audio] Synthesizing narration speech...")
    engine = pyttsx3.init()
    engine.setProperty('rate', 145) # Natural speaking pace
    engine.save_to_file(narration_text, wav_path)
    engine.runAndWait()

    wav_size = os.path.getsize(wav_path)
    print(f"[Audio] Generated WAV audio: {wav_size} bytes")

    # Mux audio and video using ffmpeg
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    output_muxed = os.path.join(demo_dir, "habitflow-demo-with-audio.mp4")

    # ffmpeg command to mux video and audio, matching video duration
    cmd = [
        ffmpeg_exe,
        "-y",
        "-i", video_source,
        "-i", wav_path,
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        output_muxed
    ]

    print("[FFmpeg] Muxing audio and video with FFmpeg...")
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    if os.path.exists(output_muxed) and os.path.getsize(output_muxed) > 1000000:
        # Replace original with the audio-enabled MP4
        if os.path.exists(temp_mp4):
            os.remove(temp_mp4)
        os.replace(output_muxed, final_mp4)
        print(f"[Done] Final video successfully created at: {final_mp4}")
        print(f"[Done] Final file size: {os.path.getsize(final_mp4) / (1024*1024):.2f} MB")
    else:
        print("Muxing warning. Output info:", res.stderr[-500:])

if __name__ == "__main__":
    main()
