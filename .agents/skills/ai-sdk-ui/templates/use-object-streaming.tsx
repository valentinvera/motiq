/**
 * AI SDK UI - Streaming Structured Data
 *
 * Demonstrates:
 * - useObject hook for streaming structured data
 * - Partial object updates (live as schema fields fill in)
 * - Zod schema validation
 * - Loading states
 * - Error handling
 *
 * Use cases:
 * - Forms generation
 * - Recipe creation
 * - Product specs
 * - Structured content generation
 *
 * Usage:
 * 1. Copy this component
 * 2. Create /api/object route with streamObject
 * 3. Define Zod schema matching your needs
 */

"use client"

import { useObject } from "ai/react"
import { type FormEvent, useState } from "react"
import { z } from "zod"

// Define the schema for the object
const recipeSchema = z.object({
  recipe: z.object({
    name: z.string().describe("Recipe name"),
    description: z.string().describe("Short description"),
    prepTime: z.number().describe("Preparation time in minutes"),
    cookTime: z.number().describe("Cooking time in minutes"),
    servings: z.number().describe("Number of servings"),
    difficulty: z.enum(["easy", "medium", "hard"]),
    ingredients: z.array(
      z.object({
        item: z.string(),
        amount: z.string(),
      })
    ),
    instructions: z.array(z.string()),
  }),
})

export default function ObjectStreaming() {
  const { object, submit, isLoading, error, stop } = useObject({
    api: "/api/recipe",
    schema: recipeSchema,
  })

  const [input, setInput] = useState("")

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    submit(input)
    setInput("")
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      {/* Header */}
      <div>
        <h1 className="font-bold text-3xl">AI Recipe Generator</h1>
        <p className="mt-2 text-gray-600">
          Streaming structured data with live updates
        </p>
      </div>

      {/* Input form */}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label
            className="mb-2 block font-medium text-gray-700 text-sm"
            htmlFor="dish"
          >
            What would you like to cook?
          </label>
          <input
            className="w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            disabled={isLoading}
            id="dish"
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., 'chocolate chip cookies' or 'thai green curry'"
            type="text"
            value={input}
          />
        </div>

        <div className="flex space-x-2">
          {isLoading ? (
            <button
              className="rounded-lg bg-red-500 px-6 py-2 text-white hover:bg-red-600"
              onClick={stop}
              type="button"
            >
              Stop
            </button>
          ) : (
            <button
              className="rounded-lg bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
              disabled={!input.trim()}
              type="submit"
            >
              Generate Recipe
            </button>
          )}
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <strong>Error:</strong> {error.message}
        </div>
      )}

      {/* Generated recipe */}
      {(object?.recipe || isLoading) && (
        <div className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
          {/* Recipe header */}
          <div className="border-b pb-4">
            <h2 className="font-bold text-2xl">
              {object?.recipe?.name || (
                <span className="text-gray-400 italic">
                  {isLoading ? "Generating name..." : "Recipe name"}
                </span>
              )}
            </h2>
            {object?.recipe?.description && (
              <p className="mt-2 text-gray-600">{object.recipe.description}</p>
            )}
          </div>

          {/* Recipe meta */}
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-semibold text-gray-700">Prep Time</div>
              <div>
                {object?.recipe?.prepTime ? (
                  `${object.recipe.prepTime} min`
                ) : (
                  <span className="text-gray-400">...</span>
                )}
              </div>
            </div>
            <div>
              <div className="font-semibold text-gray-700">Cook Time</div>
              <div>
                {object?.recipe?.cookTime ? (
                  `${object.recipe.cookTime} min`
                ) : (
                  <span className="text-gray-400">...</span>
                )}
              </div>
            </div>
            <div>
              <div className="font-semibold text-gray-700">Servings</div>
              <div>
                {object?.recipe?.servings || (
                  <span className="text-gray-400">...</span>
                )}
              </div>
            </div>
            <div>
              <div className="font-semibold text-gray-700">Difficulty</div>
              <div className="capitalize">
                {object?.recipe?.difficulty || (
                  <span className="text-gray-400">...</span>
                )}
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <h3 className="mb-3 font-semibold text-xl">Ingredients</h3>
            {object?.recipe?.ingredients &&
            object.recipe.ingredients.length > 0 ? (
              <ul className="space-y-2">
                {object.recipe.ingredients.map((ingredient, idx) => (
                  <li className="flex items-start" key={idx}>
                    <span className="mr-2 text-blue-500">•</span>
                    <span>
                      {ingredient.amount} {ingredient.item}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 italic">
                {isLoading ? "Loading ingredients..." : "No ingredients yet"}
              </p>
            )}
          </div>

          {/* Instructions */}
          <div>
            <h3 className="mb-3 font-semibold text-xl">Instructions</h3>
            {object?.recipe?.instructions &&
            object.recipe.instructions.length > 0 ? (
              <ol className="space-y-3">
                {object.recipe.instructions.map((step, idx) => (
                  <li className="flex items-start" key={idx}>
                    <span className="mt-0.5 mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm text-white">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-gray-400 italic">
                {isLoading ? "Loading instructions..." : "No instructions yet"}
              </p>
            )}
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center justify-center space-x-2 py-4 text-blue-600">
              <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600" />
              <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600 delay-100" />
              <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600 delay-200" />
              <span>Generating recipe...</span>
            </div>
          )}
        </div>
      )}

      {/* Example prompts */}
      {!(object || isLoading) && (
        <div className="space-y-2">
          <h3 className="font-semibold">Try these:</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              "Chocolate chip cookies",
              "Thai green curry",
              "Classic margarita pizza",
              "Banana bread",
            ].map((example, idx) => (
              <button
                className="rounded-lg border p-3 text-left hover:bg-gray-50"
                key={idx}
                onClick={() => setInput(example)}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
