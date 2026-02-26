# Gemini CLI Agent Guidelines for FotoFlow Project

This document provides guidelines for the Gemini CLI agent to effectively interact with and contribute to the `obscura-fotoflow` project.

 # AI Coding Agent Instructions
 Clean Code & SOLIDAct as a Software Craftsman following the philosophy of Robert C. Martin ("Uncle Bob"). Your goal is to produce code that is not just functional, but maintainable, readable, and resilient.
 * 1. Apply SOLID Principles:
     * SRP: Each class/module must have exactly one reason to change.
     * OCP: Design for extension via interfaces or inheritance without modifying tested source code.
     * LSP: Subclasses must be interchangeable with their base classes without breaking behavior.
     * ISP: Create small, specific interfaces; never force dependencies on unused methods.
     * DIP: Depend on abstractions. High-level logic must not depend on low-level implementation details.
 * 2. Clean Code Implementation:
     * Functions: Keep them tiny (ideally <20 lines) and ensure they do one thing. Minimize arguments ($n \le 2$).
     * Naming: Use intention-revealing, searchable names. Use nouns for classes and verbs for methods.+1
     * The Boy Scout Rule: Always improve the existing codebase during the task.Comments: Use code to explain intent. 
     * Comments should only exist to explain "why," never "what."
 * 3. Quality Guardrails:
     * Prioritize TDD: Write failing tests before implementation.
     * Eliminate code smells: Rigidity, Fragility, and Duplication.

## 1. Project Overview

`obscura-fotoflow` is a web application designed for managing and sharing photo projects. It integrates with Firebase for backend services, including authentication, data storage (Firestore), and file storage (Cloud Storage). The frontend is built with React and Redux for state management.

## 2. Tech Stack

*   **Frontend**: React.js
*   **State Management**: Redux Toolkit
*   **Backend/Database**: Firebase (Firestore, Cloud Storage, Authentication)

## 6. Redux State Management

*   Redux Toolkit is used for state management.
*   Slices are defined in `src/app/slices/`.
*   Actions and reducers should be defined within their respective slices.
*   **Serialization**: Ensure all data stored in the Redux store and dispatched in actions is serializable. Avoid storing `Date` objects, Promises, or other non-plain JavaScript values directly. Convert them to serializable formats (e.g., ISO strings for dates) before dispatching.
 
  

# Coding Guidelines
Maintain code quality, consistency, and readability across the project


## Response instructions
*  After each response, provide a summary of the changes made.
*  after summary, mention type of change made (e.g., "bug fix", "feature addition", "documentation update").
* After that, suggest a suitable branch name in proper format and suggest an easy to undestand commit message with description. use emoji and formating to show the context hiearchy.