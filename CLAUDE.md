# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Options trading system with three components: a **WinForms desktop app** that polls Schwab API for real-time quotes and executes trades, an **ASP.NET Core Web API** as the central business/data layer, and a separate **Angular frontend** (in `options-trader-web` repo) for read-only trade history visualization.

## Workflow Rules

- When the user says "vamos a hacer un feature nuevo" (or similar), always create a new branch based on `main` before starting any work. Use a short descriptive kebab-case name (e.g. `feature/route-guard`, `feature/s3-images`). Ask the user for a branch name if it's not obvious from context.
- When the user says "commit", commit immediately without asking for confirmation.
- When the user says "push", push immediately without asking for confirmation.
