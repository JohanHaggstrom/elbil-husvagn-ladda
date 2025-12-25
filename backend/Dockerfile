# Stage 1: Build the .NET application
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY ["ElbilHusvagnLadda.WebApi/ElbilHusvagnLadda.WebApi.csproj", "ElbilHusvagnLadda.WebApi/"]
RUN dotnet restore "ElbilHusvagnLadda.WebApi/ElbilHusvagnLadda.WebApi.csproj"

# Copy the remaining source code
COPY . .
WORKDIR "/src/ElbilHusvagnLadda.WebApi"
RUN dotnet build "ElbilHusvagnLadda.WebApi.csproj" -c Release -o /app/build

# Publish the application
FROM build AS publish
RUN dotnet publish "ElbilHusvagnLadda.WebApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Run the application
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Expose port 8080 (standard for non-root .NET images)
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "ElbilHusvagnLadda.WebApi.dll"]
