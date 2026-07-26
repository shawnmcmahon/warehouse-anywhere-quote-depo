FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY QuoteDepot.sln ./
COPY backend/QuoteDepot.Api/QuoteDepot.Api.csproj backend/QuoteDepot.Api/
COPY backend/QuoteDepot.Domain/QuoteDepot.Domain.csproj backend/QuoteDepot.Domain/
COPY backend/QuoteDepot.Infrastructure/QuoteDepot.Infrastructure.csproj backend/QuoteDepot.Infrastructure/
RUN dotnet restore backend/QuoteDepot.Api/QuoteDepot.Api.csproj
COPY backend/ backend/
RUN dotnet publish backend/QuoteDepot.Api/QuoteDepot.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
ENV Data__SqlitePath=/data/quotedepot.db
ENV Data__UploadsPath=/data/uploads
RUN mkdir -p /data/uploads
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "QuoteDepot.Api.dll"]
